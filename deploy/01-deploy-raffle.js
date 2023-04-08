const { ethers, network } = require("hardhat")
const { developmentChains, networksConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("1")
    let VRFCoordinatorAddress, suscriptionId, VRFCoordinatorV2Mock
    if (developmentChains.includes(network.name)) {
        VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        VRFCoordinatorAddress = VRFCoordinatorV2Mock.address
        const transactionResponse = await VRFCoordinatorV2Mock.createSubscription()
        const receipt = await transactionResponse.wait(1)
        suscriptionId = receipt.events[0].args.subId
        await VRFCoordinatorV2Mock.fundSubscription(suscriptionId, VRF_SUB_FUND_AMOUNT)
    } else {
        VRFCoordinatorAddress = networksConfig[chainId]["vrfCoordinator"]
        suscriptionId = process.env.VRF_ID
    }

    //     address vrfCoordinatorV2, //contract -> mocks for tests
    //     uint256 entranceFee,
    //     bytes32 gasLane,
    //     uint16 suscriptionId,
    //     uint32 callBackGasLimit,
    //     RaffleState _raffleState,
    //     uint256 interval

    const entrance_fee = networksConfig[chainId]["entrance_fee"]
    const gas_lane = networksConfig[chainId]["gas_lane"]
    const vrf_id = suscriptionId
    const callBackGasLimit = networksConfig[chainId]["callBackGasLimit"]
    const interval = networksConfig[chainId]["interval"]
    // const

    const args = [
        VRFCoordinatorAddress,
        entrance_fee,
        gas_lane,
        vrf_id,
        callBackGasLimit,
        0,
        interval,
    ]

    const raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.waitConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(raffle.address, args)
    }

    if (developmentChains.includes(network.name)) {
        await VRFCoordinatorV2Mock.addConsumer(suscriptionId, raffle.address)
    }

    log("-----------------")
}

module.exports.tags = ["all", "raffle"]
