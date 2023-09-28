const { ethers, network } = require("hardhat")
const FRONT_EMD_ADDRESSES_FILES = "../react-lottery/constants/contractAddresses.json"
const FRON_END_ABI = "../react-lottery/constants/abi.json"
const fs = require("fs")

module.exports = async function () {
    if (process.env.UPDATE_FRONT_END) {
        console.log("updating front end...")
        updateContractAddresses()
        updateAbi()
    }
}

const updateAbi = async () => {
    const raffle = await ethers.getContract("Raffle")
    fs.writeFileSync(FRON_END_ABI, raffle.interface.format(ethers.utils.FormatTypes.json))
}

const updateContractAddresses = async () => {
    const raffle = await ethers.getContract("Raffle")
    const chainId = network.config.chainId.toString()
    let currentAddresses = fs.readFileSync(FRONT_EMD_ADDRESSES_FILES, "utf8")
    currentAddresses = JSON.parse(currentAddresses)
    if (chainId in currentAddresses) {
        if (!currentAddresses[chainId].includes(raffle.address)) {
            currentAddresses[chainId].push(raffle.address)
        }
    } else {
        currentAddresses[chainId] = [raffle.address]
    }
    console.log("currentAddresses: ", currentAddresses)

    fs.writeFileSync(FRONT_EMD_ADDRESSES_FILES, JSON.stringify(currentAddresses))
}

module.exports.tags = ["all", "frontEnd"]
