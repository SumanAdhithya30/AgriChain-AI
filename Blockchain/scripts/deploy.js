import hre from "hardhat";

async function main() {
  console.log("Starting deployment (V5 - Farmer-Based Tracking)...");
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy RegistryContract FIRST
  console.log("\nDeploying RegistryContract...");
  const Registry = await hre.ethers.getContractFactory("RegistryContract");
  const registry = await Registry.deploy();
  const registryAddress = await registry.getAddress();
  console.log("=> RegistryContract deployed to:", registryAddress);

  // 2. Deploy ProductContract, linking to Registry
  console.log("\nDeploying ProductContract (linking to Registry)...");
  const Product = await hre.ethers.getContractFactory("ProductContract");
  const product = await Product.deploy(registryAddress);
  const productAddress = await product.getAddress();
  console.log("=> ProductContract deployed to:", productAddress);

  // 3. Deploy TraceabilityContract, linking to BOTH Registry and Product contracts
  console.log("\nDeploying TraceabilityContract (linking to Registry and Product)...");
  const Traceability = await hre.ethers.getContractFactory("TraceabilityContract");
  const traceability = await Traceability.deploy(registryAddress, productAddress); // Pass both addresses
  const traceabilityAddress = await traceability.getAddress();
  console.log("=> TraceabilityContract deployed to:", traceabilityAddress);

  // 4. Deploy AgreementContract, linking to ProductContract
  console.log("\nDeploying AgreementContract (linking to ProductContract)...");
  const Agreement = await hre.ethers.getContractFactory("AgreementContract");
  const agreement = await Agreement.deploy(productAddress);
  const agreementAddress = await agreement.getAddress();
  console.log("=> AgreementContract deployed to:", agreementAddress);
  
  // 5. Link ProductContract with AgreementContract (for decreasing quantity)
  console.log("\nLinking ProductContract with AgreementContract...");
  const tx = await product.connect(deployer).setAgreementContract(agreementAddress);
  await tx.wait();
  console.log("=> Contracts linked successfully!");


  // --- FINAL SUMMARY ---
  console.log("\n\n--- Deployment Complete ---");
  console.log("RegistryContract Address:    ", registryAddress);
  console.log("ProductContract Address:     ", productAddress);
  console.log("TraceabilityContract Address:", traceabilityAddress);
  console.log("AgreementContract Address:   ", agreementAddress);
  console.log("---------------------------\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});