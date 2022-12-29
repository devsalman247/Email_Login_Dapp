import { Web3Auth } from "@web3auth/modal";
import Web3 from "web3";
import { useState, useEffect } from "react";
import "./App.css";

function App() {
	const [address, setAddress] = useState("");
	const [web3auth, setWeb3auth] = useState(null);

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
		const userAccounts = await web3.eth.getAccounts();
		setAddress(userAccounts[0]);
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

	useEffect(() => {
		localStorage.clear();
		const init = async () => {
			try {
				const web3auth = new Web3Auth({
					clientId: "BD3vOjiwGiSFmmJ59O_sk3_g26oRtYnmn3OPNN7DmhWuZppFypQY2ETVWH8bMTRlPWtCRC0im1hkqNBHLODvFLw",
					chainConfig: {
						chainNamespace: "eip155",
						chainId: "0x1",
						rpcTarget: "https://rpc.ankr.com/eth",
						displayName: "Ethereum Mainnet",
						blockExplorer: "https://etherscan.io/",
						ticker: "ETH",
						tickerName: "Ethereum",
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
					<button onClick={handleLogout}>Disconnect</button>
				</>
			)}
		</div>
	);
}

export default App;
