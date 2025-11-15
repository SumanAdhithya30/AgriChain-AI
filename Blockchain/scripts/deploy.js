// import hre from "hardhat";

// async function main() {
//   console.log("Starting deployment...");
//   const [deployer] = await hre.ethers.getSigners();
//   console.log("Deploying contracts with the account:", deployer.address);

//   // Deploy RegistryContract
//   console.log("\nDeploying RegistryContract...");
//   const Registry = await hre.ethers.getContractFactory("RegistryContract");
//   const registry = await Registry.deploy();
//   const registryAddress = await registry.getAddress();
//   console.log("=> RegistryContract deployed to:", registryAddress);

//   // Deploy ProductContract
//   console.log("\nDeploying ProductContract...");
//   const Product = await hre.ethers.getContractFactory("ProductContract");
//   const product = await Product.deploy();
//   const productAddress = await product.getAddress();
//   console.log("=> ProductContract deployed to:", productAddress);

//   // Deploy TraceabilityContract
//   console.log("\nDeploying TraceabilityContract...");
//   const Traceability = await hre.ethers.getContractFactory("TraceabilityContract");
//   const traceability = await Traceability.deploy();
//   const traceabilityAddress = await traceability.getAddress();
//   console.log("=> TraceabilityContract deployed to:", traceabilityAddress);

//   // Deploy AgreementContract, passing the ProductContract's address
//   console.log("\nDeploying AgreementContract (linking to ProductContract)...");
//   const Agreement = await hre.ethers.getContractFactory("AgreementContract");
//   const agreement = await Agreement.deploy(productAddress); // Pass the address here
//   const agreementAddress = await agreement.getAddress();
//   console.log("=> AgreementContract deployed to:", agreementAddress);

//   console.log("\n\n--- Deployment Complete ---");
//   console.log("RegistryContract Address:    ", registryAddress);
//   console.log("ProductContract Address:     ", productAddress);
//   console.log("TraceabilityContract Address:", traceabilityAddress);
//   console.log("AgreementContract Address:   ", agreementAddress);
//   console.log("---------------------------\n");
// }

// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });


import hre from "hardhat";

async function main() {
  console.log("Starting deployment...");
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Correct gas estimation function for ethers v6
  async function estimate(factory, ...args) {
    const deployTx = await factory.getDeployTransaction(...args);
    return deployer.estimateGas(deployTx);
  }

  console.log("\n--- Gas Estimates ---");

  // Registry
  const Registry = await hre.ethers.getContractFactory("RegistryContract");
  const gasRegistry = await estimate(Registry);
  console.log("RegistryContract Gas:", gasRegistry.toString());

  // Product
  const Product = await hre.ethers.getContractFactory("ProductContract");
  const gasProduct = await estimate(Product);
  console.log("ProductContract Gas:", gasProduct.toString());

  // Traceability
  const Traceability = await hre.ethers.getContractFactory("TraceabilityContract");
  const gasTraceability = await estimate(Traceability);
  console.log("TraceabilityContract Gas:", gasTraceability.toString());

  // Agreement (needs product address)
  const fakeProduct = "0x0000000000000000000000000000000000000001";
  const Agreement = await hre.ethers.getContractFactory("AgreementContract");
  const gasAgreement = await estimate(Agreement, fakeProduct);
  console.log("AgreementContract Gas:", gasAgreement.toString());

  console.log("\n--- Gas Estimation Complete ---");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
