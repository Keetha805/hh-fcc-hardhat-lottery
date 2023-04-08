const { network, ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

const BASE_FEE = ethers.utils.parseEther("0.25") // 0.25 is the premium. It costs 0.25 LINK
const GAS_PRICE_LINK = 1e9 // LINK per gas. calculated value based on the gas price of the chain

module.exports = async function ({ deployments, getNamedAccounts }) {
    const { deployer } = await getNamedAccounts()
    const { deploy, log } = deployments

    // constructor(uint96 _baseFee, uint96 _gasPriceLink) {
    if (developmentChains.includes(network.name)) {
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            args: [BASE_FEE, GAS_PRICE_LINK],
            log: true,
            waitConfirmations: network.config.blockConfirmations || 1,
        })
        log("Mocks deployed")
    }
}

module.exports.tags = ["all"]
