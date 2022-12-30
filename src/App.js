/* global BigInt */
import { Web3Auth } from "@web3auth/modal";
import Web3 from "web3";
import { useState, useEffect } from "react";
import "./App.css";
import Swal from "sweetalert2";
const DOX_V1_CONTRACT_ADDRESS = "0xF3e5a8b4b290F0841506076E086f09Ec1184fC78";
const DOX_V1_CONTRACT_ABI = [
	{
		inputs: [
			{ internalType: "string", name: "tokenName", type: "string" },
			{ internalType: "string", name: "tokenSymbol", type: "string" },
			{ internalType: "uint8", name: "tokenDecimals", type: "uint8" },
			{ internalType: "uint256", name: "totalSupply", type: "uint256" },
			{ internalType: "address", name: "tokenOwnerAddress", type: "address" },
		],
		stateMutability: "payable",
		type: "constructor",
	},
	{
		anonymous: false,
		inputs: [
			{ indexed: true, internalType: "address", name: "owner", type: "address" },
			{ indexed: true, internalType: "address", name: "spender", type: "address" },
			{ indexed: false, internalType: "uint256", name: "value", type: "uint256" },
		],
		name: "Approval",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{ indexed: true, internalType: "address", name: "from", type: "address" },
			{ indexed: true, internalType: "address", name: "to", type: "address" },
			{ indexed: false, internalType: "uint256", name: "value", type: "uint256" },
		],
		name: "Transfer",
		type: "event",
	},
	{
		inputs: [
			{ internalType: "address", name: "owner", type: "address" },
			{ internalType: "address", name: "spender", type: "address" },
		],
		name: "allowance",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "address", name: "spender", type: "address" },
			{ internalType: "uint256", name: "value", type: "uint256" },
		],
		name: "approve",
		outputs: [{ internalType: "bool", name: "", type: "bool" }],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [{ internalType: "address", name: "account", type: "address" }],
		name: "balanceOf",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [{ internalType: "uint256", name: "value", type: "uint256" }],
		name: "burn",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [],
		name: "decimals",
		outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "address", name: "spender", type: "address" },
			{ internalType: "uint256", name: "subtractedValue", type: "uint256" },
		],
		name: "decreaseAllowance",
		outputs: [{ internalType: "bool", name: "", type: "bool" }],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "address", name: "spender", type: "address" },
			{ internalType: "uint256", name: "addedValue", type: "uint256" },
		],
		name: "increaseAllowance",
		outputs: [{ internalType: "bool", name: "", type: "bool" }],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [],
		name: "name",
		outputs: [{ internalType: "string", name: "", type: "string" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "symbol",
		outputs: [{ internalType: "string", name: "", type: "string" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "totalSupply",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "address", name: "recipient", type: "address" },
			{ internalType: "uint256", name: "amount", type: "uint256" },
		],
		name: "transfer",
		outputs: [{ internalType: "bool", name: "", type: "bool" }],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "address", name: "sender", type: "address" },
			{ internalType: "address", name: "recipient", type: "address" },
			{ internalType: "uint256", name: "amount", type: "uint256" },
		],
		name: "transferFrom",
		outputs: [{ internalType: "bool", name: "", type: "bool" }],
		stateMutability: "nonpayable",
		type: "function",
	},
];
const DOX_GOLD_CONTRACT_ADDRESS = "0x0B03983A68cDc5Dd323E57c8d3025856C09D6F2C";
const DOX_V1_DECIMALS = 10 ** 10;

function App() {
	const [address, setAddress] = useState("");
	const [web3auth, setWeb3auth] = useState(null);
	const [signature, setSignature] = useState("");
	const [web3, setWeb3] = useState(null);
	const [balance, setBalance] = useState(0);
	const [isWalletApproved, setIsWalletApproved] = useState(false);
	const [receiver, setReceiver] = useState("");

	const handleSubmit = async () => {
		if (!web3auth) {
			console.log("web3auth not initialized yet");
			return;
		}
		const web3authProvider = await web3auth.connect();
		const web3 = new Web3(web3authProvider);
		setWeb3(web3);
		const userAccounts = await web3.eth.getAccounts();
		setAddress(userAccounts[0]);
		const balance = web3.utils.fromWei(
			await web3.eth.getBalance(userAccounts[0]) // Balance is in wei
		);
		setBalance(balance);
		// console.log(userAccounts);
	};

	const handleLogout = async () => {
		if (!web3auth) {
			console.log("web3auth not initialized yet");
			return;
		}
		await web3auth.logout();
		setAddress("");
	};

	const signMessage = async () => {
		console.log(signature);
		if (!signature) {
			console.log("No message to sign");
			return;
		}
		if (!web3) {
			console.log("web3 not initialized yet");
			return;
		}
		const signatur = await web3.eth.personal.sign(signature, address);
		console.log(signatur);
	};

	const initializeContract = async (abi, address) => {
		try {
			let res = new web3.eth.Contract(abi, address);
			return res;
		} catch (error) {
			console.log(error);
			return;
		}
	};

	const approveWallet = async () => {
		Swal.fire({
			title: "Approving you wallet...",
			html: "Please proceed your transaction through wallet!",
			didOpen: () => {
				Swal.showLoading();
			},
		});
		try {
			const contract_instance = await initializeContract(
				DOX_V1_CONTRACT_ABI,
				"0xF3e5a8b4b290F0841506076E086f09Ec1184fC78"
			);
			const data = await contract_instance.methods
				.approve(DOX_GOLD_CONTRACT_ADDRESS, BigInt(10000000000000 * DOX_V1_DECIMALS))
				.send({ from: address });
			console.log(data, "data");

			if (data) {
				Swal.close();
				Swal.fire({
					icon: "Success",
					title: "Successfully approved!",
				});
				setIsWalletApproved(true);
			} else {
				Swal.close();
				Swal.fire({
					icon: "error",
					title: "Failed to approve!...",
				});
			}
		} catch (error) {
			console.log(error);
			Swal.close();
			Swal.fire({
				icon: "error",
				title: "Failed to approve.Something unknown happened!",
			});
			return;
		}
	};

	const checkApproval = async () => {
		try {
			const contract_instance = await initializeContract(DOX_V1_CONTRACT_ABI, DOX_V1_CONTRACT_ADDRESS);
			if (address) {
				const data = await contract_instance.methods.allowance(address, DOX_GOLD_CONTRACT_ADDRESS).call();
				const isApproved = Number(data) > 0 ? true : false;
				setIsWalletApproved(isApproved);
				return;
			}
		} catch (error) {
			console.log(error);
			return;
		}
	};

	const sendBNB = async () => {
		if (receiver) {
			Swal.fire({
				title: `Sending BNB to ${receiver.slice(0, 5)}...`,
				html: "Please wait!",
				didOpen: () => {
					Swal.showLoading();
				},
			});
			try {
				const amount = web3.utils.toWei("0.001");
				const receipt = await web3.eth.sendTransaction({
					from: address,
					to: receiver,
					value: amount,
				});
				console.log(receipt);
				if (receipt) {
					Swal.close();
					Swal.fire({
						icon: "Success",
						title: "Successfully sent BNB!",
					});
					setReceiver("");
				} else {
					Swal.close();
					Swal.fire({
						icon: "error",
						title: "Failed to send BNB!...",
					});
				}
			} catch (error) {
				console.log(error);
				Swal.close();
				Swal.fire({
					icon: "error",
					title: "Failed to send BNB!",
				});
				return;
			}
		}
	};

	useEffect(() => {
		const init = async () => {
			try {
				const web3auth = new Web3Auth({
					clientId: "BD3vOjiwGiSFmmJ59O_sk3_g26oRtYnmn3OPNN7DmhWuZppFypQY2ETVWH8bMTRlPWtCRC0im1hkqNBHLODvFLw",
					chainConfig: {
						// chainId: "0x1",
						// rpcTarget: "https://rpc.ankr.com/eth",
						chainNamespace: "eip155",
						chainId: "0x61",
						rpcTarget: "https://rpc.ankr.com/bsc_testnet_chapel",
						displayName: "Binance SmartChain Testnet",
						blockExplorer: "https://testnet.bscscan.com",
						ticker: "BNB",
						tickerName: "BNB",
						// displayName: "Ethereum Mainnet",
						// blockExplorer: "https://etherscan.io/",
						// ticker: "ETH",
						// tickerName: "Ethereum",
					},
				});
				setWeb3auth(web3auth);
				await web3auth.initModal();
			} catch (error) {
				console.error(error);
			}
		};
		init();
		if (address) checkApproval();
	}, []);

	return (
		<div className="App">
			{address ? (
				<>
					<p>Connected: true</p>
					<p>Your wallet: {address}</p>
					<p>Your bnb balance: {balance} BNB</p>
					<button onClick={handleLogout}>Disconnect</button> <br />
					<div style={{ marginTop: "20px" }}>
						<input type="text" value={signature} onChange={(e) => setSignature(e.target.value)} />
						<button onClick={signMessage}>Sign Message</button>
					</div>
					<div style={{ marginTop: "20px" }}>
						<input type="text" value={receiver} onChange={(e) => setReceiver(e.target.value)} />
						<button onClick={sendBNB}>Send BNB</button>
					</div>
					<p>Wallet Approved: {`${isWalletApproved}`}</p>
					<button onClick={approveWallet}>Approve Wallet</button>
				</>
			) : (
				<button onClick={handleSubmit}>Click to login</button>
			)}
		</div>
	);
}

export default App;
