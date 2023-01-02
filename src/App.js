/* global BigInt */
import { Web3Auth } from "@web3auth/modal";
import Web3 from "web3";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
	DOX_V1_CONTRACT_ADDRESS,
	DOX_V1_CONTRACT_ABI,
	DEV_COIN_CONTRACT_ADDRESS,
	DEV_COIN_CONTRACT_ABI,
	DOX_GOLD_CONTRACT_ADDRESS,
	DOX_GOLD_CONTRACT_ABI,
	DOX_V1_DECIMALS,
} from "./constants/constants";

function App() {
	const [address, setAddress] = useState("");
	const [web3auth, setWeb3auth] = useState(null);
	const [message, setMessage] = useState("");
	const [signature, setSignature] = useState("");
	const [web3, setWeb3] = useState(null);
	const [balance, setBalance] = useState(0);
	const [devBalance, setDevBalance] = useState(0);
	const [isWalletApproved, setIsWalletApproved] = useState(false);
	const [receiver, setReceiver] = useState("");
	const [devReceiver, setDevReceiver] = useState("");
	const [txHash, setTxHash] = useState("");
	const [devTxHash, setDevTxHash] = useState("");
	const [chainId, setChainId] = useState(0);

	const initializeContract = async (abi, address) => {
		try {
			let res = new web3.eth.Contract(abi, address);
			return res;
		} catch (error) {
			console.log(error);
			return;
		}
	};

	const handleSubmit = async () => {
		if (!web3auth) {
			console.log("web3auth not initialized yet");
			return;
		}
		const web3authProvider = await web3auth.connect();

		const web3 = new Web3(web3authProvider);
		setWeb3(web3);

		// Get the chain ID
		const chain = await web3.eth.getChainId();
		setChainId(chain);

		// Get the user's address
		const userAccounts = await web3.eth.getAccounts();
		setAddress(userAccounts[0]);

		// Get the user's balance
		const balance = web3.utils.fromWei(
			await web3.eth.getBalance(userAccounts[0]) // Balance is in wei
		);
		setBalance(balance, typeof balance, "vnvbnbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");

		// Get the user's DEV balance
		// await getDevBalance();
	};

	const getDevBalance = async () => {
		try {
			const contract_instance = await initializeContract(DEV_COIN_CONTRACT_ABI, DEV_COIN_CONTRACT_ADDRESS);
			let DEV_BALANCE = await contract_instance.methods.balanceOf(address).call();
			DEV_BALANCE = DEV_BALANCE / 10 ** 18;
			setDevBalance(DEV_BALANCE);
		} catch (error) {
			console.log(error);
			return;
		}
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
		// console.log(message);
		if (!message) {
			console.log("No message to sign");
			return;
		} else {
			const signatur = await web3.eth.personal.sign(message, address);
			if (signatur) {
				setMessage("");
				setSignature(signatur);
			}
			console.log(signatur);
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
			const contract_instance = await initializeContract(DOX_V1_CONTRACT_ABI, DOX_V1_CONTRACT_ADDRESS);
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

	const sendETH = async () => {
		if (receiver) {
			Swal.fire({
				title: `Sending ETH to ${receiver.slice(0, 5)}...`,
				html: "Please wait!",
				didOpen: () => {
					Swal.showLoading();
				},
			});
			try {
				const amount = web3.utils.toWei("0.01");
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
						title: "Successfully sent 0.01 ETH!",
					});
					setReceiver("");
					setTxHash(receipt.transactionHash);
				} else {
					Swal.close();
					Swal.fire({
						icon: "error",
						title: "Failed to send ETH!...",
					});
				}
			} catch (error) {
				console.log(error);
				Swal.close();
				Swal.fire({
					icon: "error",
					title: "Failed to send ETH!",
				});
				return;
			}
		} else {
			Swal.fire({
				icon: "error",
				title: "Please enter receiver address!...",
			});
			return;
		}
	};

	const sendDEV = async () => {
		// console.log(devBalance, devReceiver);

		if (devReceiver) {
			Swal.fire({
				title: `Sending DEV to ${devReceiver.slice(0, 5)}...`,
				html: "Please wait!",
				didOpen: () => {
					Swal.showLoading();
				},
			});
			try {
				const contract_instance = await initializeContract(DEV_COIN_CONTRACT_ABI, DEV_COIN_CONTRACT_ADDRESS);
				const transferHashObject = await contract_instance.methods
					.transfer(devReceiver, BigInt(10 * 10 ** 18))
					.send({ from: address })
					.then((res) => res)
					.catch((err) => {
						console.log(err);
						return;
					});

				console.log(transferHashObject, "devHash");
				setDevTxHash(transferHashObject.transactionHash);

				if (transferHashObject) {
					Swal.close();
					Swal.fire({
						icon: "Success",
						title: `Successfully sent 10 DEV to ${devReceiver.slice(0, 4)}..!`,
					});
					getDevBalance();
					setDevReceiver("");
				} else {
					Swal.close();
					Swal.fire({
						icon: "error",
						title: "Failed to send DEV...!",
					});
					return;
				}
			} catch (error) {
				console.log(error);
				Swal.close();
				Swal.fire({
					icon: "error",
					title: "Failed to send DEV!",
				});
				return;
			}
		} else {
			Swal.fire({
				icon: "error",
				title: "Please enter receiver address!...",
			});
			return;
		}
	};

	const init = async () => {
		try {
			const web3auth = new Web3Auth({
				clientId: "BD3vOjiwGiSFmmJ59O_sk3_g26oRtYnmn3OPNN7DmhWuZppFypQY2ETVWH8bMTRlPWtCRC0im1hkqNBHLODvFLw",
				chainConfig: {
					// Binance Smart Chain Testnet
					chainNamespace: "eip155",
					chainId: "0x61",
					rpcTarget: "https://data-seed-prebsc-2-s3.binance.org:8545",
					displayName: "Binance SmartChain Testnet",
					blockExplorer: "https://testnet.bscscan.com",
					ticker: "BNB",
					tickerName: "BNB",

					// Ethereum Goerli Testnet

					// chainNamespace: "eip155",
					// chainId: "0x5",
					// rpcTarget: "https://eth-goerli.g.alchemy.com/v2/VjKY5tskg7dqhMYjET9xsxuoHLWiP-dN",
					// displayName: "Goerli Testnet",
					// blockExplorer: "https://goerli.etherscan.io",
					// ticker: "ETH",
					// tickerName: "Ethereum",

					// Ethereum Mainnet

					// chainNamespace: "eip155",
					// chainId: "0x1",
					// rpcTarget: "https://eth-mainnet.g.alchemy.com/v2/j6UTbCCbGnGifDTJGKAmsAKL0MoNdIL1",
					// displayName: "Ethereum Mainnet",
					// blockExplorer: "https://etherscan.io",
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

	useEffect(() => {
		if (address) {
			checkApproval();
			getDevBalance();
		}
	}, [web3, address]);

	useEffect(() => {
		init();
	}, []);

	return (
		<div className="h-full flex items-center justify-center text-lg">
			{address ? (
				<div>
					<p>Connected: true</p>
					<p>Your chain id: {chainId}</p>
					<p>Your wallet: {address}</p>
					<p>Your eth balance: {balance} ETH</p>
					<p>Your dev coin balance: {devBalance} DEV</p>
					<div className="mt-6">
						<input
							type="text"
							className="bg-slate-200 px-2 py-1 outline-none rounded-md"
							value={message}
							onChange={(e) => setMessage(e.target.value)}
						/>
						<button
							onClick={signMessage}
							className="bg-teal-600 px-2 py-1 text-white text-lg border-none rounded-md ml-4">
							Sign Message
						</button>{" "}
						<br />
						{signature && <p>{signature}</p>}
						<div className="mt-4">
							<input
								type="text"
								className="bg-slate-200 px-2 py-1 outline-none rounded-md"
								value={receiver}
								onChange={(e) => setReceiver(e.target.value)}
							/>
							<button
								onClick={sendETH}
								className="bg-teal-600 px-2 py-1 text-white text-lg border-none rounded-md ml-4">
								Send ETH
							</button>
							{txHash && <p className="mt-2">Last Transaction Hash: {txHash}</p>}
						</div>
						<div className="mt-4">
							<input
								type="text"
								className="bg-slate-200 px-2 py-1 outline-none rounded-md"
								value={devReceiver}
								onChange={(e) => setDevReceiver(e.target.value)}
							/>
							<button
								onClick={sendDEV}
								className="bg-teal-600 px-2 py-1 text-white text-lg border-none rounded-md ml-4">
								Send Dev Coins
							</button>
							{devTxHash && <p className="mt-2">Last Transaction Hash: {devTxHash}</p>}
						</div>
					</div>
					<div className="mt-6 flex flex-col gap-4">
						<div className="flex gap-2">
							Wallet Approved: {`${isWalletApproved}`}
							<button
								disabled={isWalletApproved}
								onClick={approveWallet}
								className={`${
									isWalletApproved ? "cursor-not-allowed" : ""
								} bg-teal-600 px-2 py-1 text-white text-lg border-none rounded-md ml-4`}>
								Approve Wallet
							</button>
						</div>
						<button onClick={handleLogout} className="bg-red-500 text-white text-xl py-2 rounded-md">
							Disconnect Wallet
						</button>
					</div>
				</div>
			) : (
				<button onClick={handleSubmit} className="bg-teal-600 px-2 py-1 text-white text-2xl border-none rounded-lg">
					Login
				</button>
			)}
		</div>
	);
}

export default App;
