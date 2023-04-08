const { network, ethers, getNamedAccounts, deployments } = require("hardhat")
const { developmentChains, networksConfig } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")
const { injectRevertString } = require("ethereum-waffle")
const { resolveConfig } = require("prettier")

const chainId = network.config.chainId
const entrance_fee = networksConfig[chainId]["entrance_fee"]

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Tests", function () {
          let raffle, vrfCoordinatorV2, deployer, interval
          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture("all")
              raffle = await ethers.getContract("Raffle", deployer)
              vrfCoordinatorV2 = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
              interval = await raffle.getInterval()
          })

          describe("constructor", function () {
              it("Initialize", async function () {
                  const raffleState = await raffle.getRaffleState()
                  const raffleInterval = await raffle.getInterval()

                  assert.equal(raffleState.toString(), "0")
                  assert.equal(raffleInterval.toString(), networksConfig[chainId]["interval"])
              })
          })
          describe("raffle enter", () => {
              it("reverts not enough", async function () {
                  await expect(raffle.enterRaffle()).to.be.revertedWith("Raffle__NotEnoughETH")
              })
              it("record player", async function () {
                  await raffle.enterRaffle({ value: entrance_fee })

                  assert.equal(await raffle.getPlayer(0), deployer)
              })
              it("emits", async function () {
                  await expect(raffle.enterRaffle({ value: entrance_fee })).to.emit(
                      raffle,
                      "RaffleEnter"
                  )
              })
              it("not allowed", async function () {
                  await raffle.enterRaffle({ value: entrance_fee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  await raffle.performUpkeep([])
                  await expect(raffle.enterRaffle({ value: entrance_fee })).revertedWith(
                      "Raffle__NotOpened"
                  )
              })
          })

          describe("checkupkeep", () => {
              it("returns false no ETH", async function () {
                  await network.provider.send("evm_increaseTime", [interval.toNumber()])
                  await network.provider.send("evm_mine", [])
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
                  assert(!upkeepNeeded)
              })
              it("returns true if enough everyyhing ok", async function () {
                  await raffle.enterRaffle({ value: entrance_fee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber()])
                  await network.provider.send("evm_mine", [])
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([]) //-> '0x' = blank byte

                  console.log("upkeepNeeded: ", upkeepNeeded)
                  assert(upkeepNeeded)
              })
          })
          describe("performUpKeep", () => {
              it("chekupkeep true -> perform", async function () {
                  await raffle.enterRaffle({ value: entrance_fee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  const tx = await raffle.performUpkeep([])
                  assert(tx)
              })

              it("reverts when check is falls", async function () {
                  await expect(raffle.performUpkeep([])).to.be.revertedWith(
                      "Raffle__UpkeepNotNeeded" //-> super especific (all the expected values)
                  )
              })
              it("updates raffle state, emits event. vrf", async function () {
                  await raffle.enterRaffle({ value: entrance_fee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  const txResponse = await raffle.performUpkeep([])
                  const receipt = await txResponse.wait(1)
                  const requestId = receipt.events[1].args.requestId
                  const raffleState = await raffle.getRaffleState()
                  assert(requestId.toNumber() > 0)
                  assert(raffleState.toString() == "1")
              })
          })

          describe("fulfill random words", () => {
              beforeEach(async () => {
                  await raffle.enterRaffle({ value: entrance_fee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
              })

              it("can only be called after perform", async function () {
                  await expect(
                      vrfCoordinatorV2.fulfillRandomWords(0, raffle.address)
                  ).to.be.revertedWith("nonexistent request")

                  await expect(
                      vrfCoordinatorV2.fulfillRandomWords(1, raffle.address)
                  ).to.be.revertedWith("nonexistent request")
              })
              it("picks a winner resets and sends money", async function () {
                  const additional = 3
                  const starting = 1
                  const accounts = await ethers.getSigners()
                  for (let i = starting; i < starting + additional; i++) {
                      const accountConnected = raffle.connect(accounts[i])
                      await accountConnected.enterRaffle({ value: entrance_fee })
                  }
                  const startingTime = await raffle.getLatestTimeStamp()

                  //perforkUpKeep

                  //fulfillRandomMock -> waiting == listener
                  await new Promise(async (res, rej) => {
                      raffle.once("PickedWinner", async () => {
                          console.log("Event!!")
                          try {
                              const recentWinner = await raffle.getRecentWinner()
                              console.log(recentWinner)
                              console.log(accounts[0].address)
                              console.log(accounts[1].address)
                              console.log(accounts[2].address)
                              console.log(accounts[3].address)
                              const raffleState = await raffle.getRaffleState()
                              const endingTime = await raffle.getLatestTimeStamp()
                              const numPlaters = await raffle.getNumberOfPlayers()
                              const winnerEndingBalance = await accounts[1].getBalance()
                              assert.equal(numPlaters, 0)
                              assert.equal(raffleState.toString(), "0")
                              assert(endingTime > startingTime)
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance.add(
                                      entrance_fee.mul(additional).add(entrance_fee).toString()
                                  )
                              )
                          } catch (error) {
                              rej(error)
                          }
                          res()
                      })

                      const tx = await raffle.performUpkeep([])
                      const receipt = await tx.wait(1)
                      const winnerStartingBalance = await accounts[1].getBalance()

                      await vrfCoordinatorV2.fulfillRandomWords(
                          receipt.events[1].args.requestId,
                          raffle.address
                      )
                  })
              })
          })
      })
