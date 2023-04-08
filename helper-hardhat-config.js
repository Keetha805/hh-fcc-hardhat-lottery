const networksConfig = {
    11155111: {
        name: "sepolia",
        vrfCoordinator: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
        entrance_fee: ethers.utils.parseEther("0.1"),
        gas_lane: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        callBackGasLimit: "2500000",
        interval: "30",
    },
    31337: {
        name: "hardhat",
        entrance_fee: ethers.utils.parseEther("0.1"),
        gas_lane: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        callBackGasLimit: "2500000",
        interval: "30",
    },
}

const developmentChains = ["hardhat", "localhost"]

module.exports = { networksConfig, developmentChains }
