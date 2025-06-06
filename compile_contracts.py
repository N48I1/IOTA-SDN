import json
import subprocess
import os

def compile_solidity_contract(file_path, output_dir="abi"):
    """Compile a Solidity contract and save its ABI"""
    # Make sure output directory exists
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Get contract name from file name
    contract_name = os.path.basename(file_path).split('.')[0]
    
    try:
        # Compile using solc (Solidity compiler)
        command = [
            "solc",
            "--combined-json", "abi,bin",
            file_path
        ]
        
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        compiled_data = json.loads(result.stdout)
        
        # Extract ABI from compilation result
        # The key format depends on solc version, but generally it's like "file.sol:ContractName"
        contract_key = None
        for key in compiled_data["contracts"].keys():
            if contract_name in key:
                contract_key = key
                break
        
        if not contract_key:
            raise Exception(f"Contract {contract_name} not found in compilation output")
        
        contract_data = compiled_data["contracts"][contract_key]
        abi = json.loads(contract_data["abi"])
        
        # Save ABI to file
        abi_file = os.path.join(output_dir, f"{contract_name.lower()}.json")
        with open(abi_file, 'w') as f:
            json.dump(abi, f, indent=2)
        
        print(f"Successfully compiled {contract_name}. ABI saved to {abi_file}")
        return abi
    
    except subprocess.CalledProcessError as e:
        print(f"Compilation error: {e.stderr}")
        raise
    except Exception as e:
        print(f"Error compiling {contract_name}: {e}")
        raise

def compile_all_contracts():
    """Compile all Solidity contracts in the current directory"""
    contracts = [
        "SecurityMonitor.sol",
        "Authority.sol",
        "AccessControl.sol"
    ]
    
    results = {}
    for contract in contracts:
        try:
            abi = compile_solidity_contract(contract)
            results[contract] = "Success"
        except Exception as e:
            results[contract] = f"Failed: {str(e)}"
    
    print("\n=== Compilation Results ===")
    for contract, result in results.items():
        print(f"{contract}: {result}")

if __name__ == "__main__":
    compile_all_contracts()