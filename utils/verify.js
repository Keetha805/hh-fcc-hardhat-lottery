const { run } = require("hardhat")

const verify = async function (contractAddress, args) {
    console.log("Verifying...")
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
        console.log("Verified!")
    } catch (err) {
        if (err.message.toLowerCase().includes("already verified")) {
            console.log("Already verified!")
        } else {
            console.log(err)
        }
    }
}

module.exports = { verify }
