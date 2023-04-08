const { network, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains, networksConfig } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

const entrance_fee = networksConfig[network.config.chainId]["entrance_fee"]

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Staging Tests", function () {
          let raffle, deployer
          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              raffle = await ethers.getContract("Raffle", deployer)
          })

          describe("fulfill", async function () {
              it("live Keepers, VRF and get random winner", async function () {
                  const startingTime = await raffle.getLatestTimeStamp()
                  const accounts = await ethers.getSigners()
                  await new Promise(async (res, rej) => {
                      raffle.once("PickedWinner", async () => {
                          console.log("Winner Picked!")
                          try {
                              const recentWinner = await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              const winnerEnding = await accounts[0].getBalance()
                              const endingTime = await raffle.getLatestTimeStamp()
                              const numPlayers = await raffle.getNumberOfPlayers()

                              assert.equal(numPlayers.toString(), "0")
                              assert.equal(recentWinner.toString(), accounts[0].address)
                              assert.equal(raffleState.toString(), "0")
                              assert.equal(
                                  winnerEnding.toString(),
                                  winnerStarting.add(entrance_fee).toString()
                              )
                              assert(endingTime > startingTime)
                              res()
                          } catch (err) {
                              console.log("err: ", err)
                              rej(err)
                          }
                      })
                      const tx = await raffle.enterRaffle({ value: entrance_fee })
                      const receipt = await tx.wait(1)
                      const winnerStarting = await accounts[0].getBalance()
                  })
              })
          })
      })
