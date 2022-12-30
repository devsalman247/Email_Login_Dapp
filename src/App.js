import { Web3Auth } from "@web3auth/modal";
import Web3 from "web3";
import { useState, useEffect } from "react";
import "./App.css";

function App() {
	const [address, setAddress] = useState("");
	const [web3auth, setWeb3auth] = useState(null);
	const [signature, setSignature] = useState("");
	const [web3, setWeb3] = useState(null);
	const [balance, setBalance] = useState(0);

	const handleSubmit = async () => {
		// const web3auth = new Web3Auth({
		// 	clientId: "BD3vOjiwGiSFmmJ59O_sk3_g26oRtYnmn3OPNN7DmhWuZppFypQY2ETVWH8bMTRlPWtCRC0im1hkqNBHLODvFLw",
		// 	chainConfig: {
		// 		chainNamespace: "eip155",
		// 		chainId: "0x1",
		// 		rpcTarget: "https://rpc.ankr.com/eth",
		// 		displayName: "Ethereum Mainnet",
		// 		blockExplorer: "https://etherscan.io/",
		// 		ticker: "ETH",
		// 		tickerName: "Ethereum",
		// 	},
		// });

		// setWeb3auth(web3auth);
		// await web3auth.initModal();

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
	}, []);

	return (
		<div className="App">
			<button onClick={handleSubmit}>Click to login</button>
			{address && (
				<>
					<p>Connected: true</p>
					<p>Your wallet: {address}</p>
					<p>Your bnb balance: {balance} BNB</p>
					<button onClick={handleLogout}>Disconnect</button> <br />
					<div style={{ marginTop: "20px" }}>
						<input type="text" value={signature} onChange={(e) => setSignature(e.target.value)} />
						<button onClick={signMessage}>Sign Message</button>
					</div>
				</>
			)}
		</div>
	);
}

export default App;
