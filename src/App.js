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
	DOX_GOLD_STAKING_CONTRACT_ADDRESS,
	DOX_GOLD_STAKING_CONTRACT_ABI,
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
	const [isNFTsApproved, setIsNFTsApproved] = useState(false);
	const [receiver, setReceiver] = useState("");
	const [devReceiver, setDevReceiver] = useState("");
	const [txHash, setTxHash] = useState("");
	const [devTxHash, setDevTxHash] = useState("");
	const [chainId, setChainId] = useState(0);
	const [nfts, setNfts] = useState({
		balance: 0,
		soldNFTs: 0,
		totalSupply: 0,
		gold: [],
		staked: [],
	});

	// create new contract instance
	const initializeContract = async (abi, address) => {
		try {
			let res = new web3.eth.Contract(abi, address);
			return res;
		} catch (error) {
			console.log(error);
			return;
		}
	};

	// handle login
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

	// handle logout
	const handleLogout = async () => {
		if (!web3auth) {
			console.log("web3auth not initialized yet");
			return;
		}
		await web3auth.logout();
		setAddress("");
	};

	// getting user's dev token balance
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

	// getting user's nfts balance, minted nfts, total supply etc...
	const getNfts = async () => {
		try {
			let balance = 0;
			let soldNFTs = 0;
			let totalSupply = 0;
			let gold = [];
			let staked = [];
			let isNFTsApproved = false;
			const contract_instance = await initializeContract(DOX_GOLD_CONTRACT_ABI, DOX_GOLD_CONTRACT_ADDRESS);
			const staking_contract_instance = await initializeContract(
				DOX_GOLD_STAKING_CONTRACT_ABI,
				DOX_GOLD_STAKING_CONTRACT_ADDRESS
			);
			if (address) {
				balance = await contract_instance.methods.balanceOf(address).call();
				isNFTsApproved = await contract_instance.methods
					.isApprovedForAll(address, DOX_GOLD_STAKING_CONTRACT_ADDRESS)
					.call();
				gold = await contract_instance.methods
					.tokensOfOwner(address)
					.call()
					.then((res) => res)
					.catch((err) => {
						console.log(err);
						return [];
					});
				gold = gold.map((nft) => Number(nft)).sort();
				staked = await staking_contract_instance.methods
					.getStakedNFTs(address)
					.call()
					.then((res) => res)
					.catch((err) => {
						console.log(err);
						return [];
					});
			}
			soldNFTs = await contract_instance.methods.getSoldNFTs().call();
			totalSupply = await contract_instance.methods.totalSupply().call();
			setNfts({
				...nfts,
				balance,
				soldNFTs,
				totalSupply,
				gold,
				staked,
			});
			setIsNFTsApproved(isNFTsApproved);
		} catch (error) {
			console.log(error);
			return;
		}
	};

	// handle signing message
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

	// check if wallet is approved
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

	// handle sending eth
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

	// handle sending dev
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

	// approve user's wallet for minting DOX NFT
	const approveWallet = async () => {
		Swal.fire({
			title: "Approving your wallet...",
			html: "Please wait!",
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

	// approving user's nfts for staking
	const approveNFTs = async () => {
		Swal.fire({
			title: "Approving NFTs...",
			html: "Please wait!",
			didOpen: () => {
				Swal.showLoading();
			},
			allowOutsideClick: false,
		});
		try {
			if (address) {
				const contract_instance = await initializeContract(DOX_GOLD_CONTRACT_ABI, DOX_GOLD_CONTRACT_ADDRESS);
				const goldApproved = await contract_instance.methods
					.setApprovalForAll(DOX_GOLD_STAKING_CONTRACT_ADDRESS, true)
					.send({ from: address })
					.then((res) => res)
					.catch((err) => {
						console.log(err);
						return;
					});

				console.log(goldApproved, "gold");
				if (goldApproved) {
					Swal.close();
					Swal.fire({
						icon: "Success",
						title: "Successfully approved!",
					});
					setIsNFTsApproved(goldApproved);
				} else {
					Swal.close();
					Swal.fire({
						icon: "error",
						title: "Failed to approve...!",
					});
					return;
				}
			} else {
				Swal.close();
				Swal.fire({
					icon: "error",
					title: "Please connect your wallet...!",
				});
				return;
			}
		} catch (error) {
			console.log(error);
			Swal.close();
			Swal.fire({
				icon: "error",
				title: "Failed to approve...!",
			});
			return;
		}
	};

	// mint DOX NFT
	const mintNFT = async () => {
		Swal.fire({
			title: "Minting",
			html: "Please wait!",
			didOpen: () => {
				Swal.showLoading();
			},
		});
		try {
			const contract_instance = await initializeContract(DOX_GOLD_CONTRACT_ABI, DOX_GOLD_CONTRACT_ADDRESS);
			let data = await contract_instance.methods.mintGoldDox(1).send({ from: address });
			console.log(data, "data");

			if (data) {
				Swal.close();
				Swal.fire({
					icon: "Success",
					title: "Successfully minted NFT!",
				});
				getNfts();
			} else {
				Swal.close();
				Swal.fire({
					icon: "error",
					title: "Failed to mint!...",
				});
			}
		} catch (error) {
			console.log(error);
			Swal.close();
			Swal.fire({
				icon: "error",
				title: "Failed to mint.Something unknown happened!",
			});
			return;
		}
	};

	// stake DOX NFT
	const stakeNFT = async (nfts) => {
		Swal.fire({
			title: "Staking",
			html: "Please wait!",
			didOpen: () => {
				Swal.showLoading();
			},
		});
		try {
			const staking_contract_instance = await initializeContract(
				DOX_GOLD_STAKING_CONTRACT_ABI,
				DOX_GOLD_STAKING_CONTRACT_ADDRESS
			);
			let staked = await staking_contract_instance.methods.stake(nfts).send({ from: address });
			console.log(staked, "data");

			if (staked) {
				Swal.close();
				Swal.fire({
					icon: "Success",
					title: "Successfully staked NFT!",
				});
				getNfts();
			} else {
				Swal.close();
				Swal.fire({
					icon: "error",
					title: "Failed to stake!...",
				});
			}
		} catch (error) {
			console.log(error);
			Swal.close();
			Swal.fire({
				icon: "error",
				title: "Failed to stake.Something unknown happened!",
			});
			return;
		}
	};

	// unstake DOX NFTs
	const unstakeNFTs = async () => {
		Swal.fire({
			title: "Unstaking NFTs...",
			html: "Please wait!",
			didOpen: () => {
				Swal.showLoading();
			},
			allowOutsideClick: false,
		});
		try {
			if (address) {
				const contract_instance = await initializeContract(
					DOX_GOLD_STAKING_CONTRACT_ABI,
					DOX_GOLD_STAKING_CONTRACT_ADDRESS
				);
				const data = await contract_instance.methods
					.unstakeAll()
					.send({ from: address })
					.then((res) => res)
					.catch((err) => {
						console.log(err);
						return;
					});

				console.log(data, "goldIsUnstaking");
				if (data) {
					Swal.close();
					Swal.fire({
						icon: "Success",
						title: "Successfully unstaked!",
					});
				} else {
					Swal.close();
					Swal.fire({
						icon: "error",
						title: "Failed to unstake...!",
					});
					return;
				}
				getNfts();
			} else {
				Swal.close();
				Swal.fire({
					icon: "error",
					title: "Please connect your wallet...!",
				});
				return;
			}
		} catch (error) {
			console.log(error);
			Swal.close();
			Swal.fire({
				icon: "error",
				title: "Failed to unstake...!",
			});
			return;
		}
	};

	// initializing web3auth instance
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
			// getDevBalance();
			getNfts();
		}
	}, [web3, address]);

	useEffect(() => {
		init();
	}, []);

	return (
		<div className="h-full flex items-center justify-center text-lg pt-4">
			{address ? (
				<div>
					<p>Connected: true</p>
					<p>Your chain id: {chainId}</p>
					<p>Your wallet: {address}</p>
					<p>Your bnb balance: {Number(balance).toFixed(2)} BNB</p>
					<p>Your dev coin balance: {devBalance} DEV</p>
					<div className="mt-6">
						<input
							type="text"
							placeholder="Enter message to sign"
							className="bg-slate-200 px-2 py-1 outline-none rounded-md"
							value={message}
							onChange={(e) => setMessage(e.target.value)}
						/>
						<button
							onClick={() => signMessage()}
							className="bg-teal-600 px-2 py-1 text-white text-lg border-none rounded-md ml-4">
							Sign Message
						</button>
						<br />
						{signature && <p>{signature}</p>}
						<div className="mt-4">
							<input
								type="text"
								placeholder="Enter receiver address"
								className="bg-slate-200 px-2 py-1 outline-none rounded-md"
								value={receiver}
								onChange={(e) => setReceiver(e.target.value)}
							/>
							<button
								onClick={() => sendETH()}
								className="bg-teal-600 px-2 py-1 text-white text-lg border-none rounded-md ml-4">
								Send ETH
							</button>
							{txHash && <p className="mt-2">Last Transaction Hash: {txHash}</p>}
						</div>
						<div className="mt-4">
							<input
								type="text"
								placeholder="Enter receiver address"
								className="bg-slate-200 px-2 py-1 outline-none rounded-md"
								value={devReceiver}
								onChange={(e) => setDevReceiver(e.target.value)}
							/>
							<button
								onClick={() => sendDEV()}
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
								onClick={() => approveWallet()}
								className={`px-2 py-1 text-lg border-none rounded-md ml-20 ${
									isWalletApproved ? "cursor-not-allowed bg-teal-200 text-teal-700" : "bg-teal-600 text-white"
								}`}>
								Approve Wallet
							</button>
						</div>
						<div>
							<h3 className="bg-teal-600 text-white text-center text-xl font-semibold px-4 py-1 mb-2 rounded-tr-md rounded-bl-md">
								DOX GOLD NFTs
							</h3>
							<p>Your NFTs Balance: {nfts.gold.length + nfts.staked.length}</p>
							{nfts.gold.length > 0 ? (
								<div>
									Minted NFTs:
									{nfts.gold.map((nft, index) => `   #${nft},`)}
								</div>
							) : (
								<p>Minted NFTs: You haven't minted any NFT yet!</p>
							)}
							{nfts.staked.length > 0 ? (
								<div>
									Staked NFTs:
									{nfts.staked.map((nft, index) => `   #${nft},`)}
								</div>
							) : (
								<p>Staked NFTs: You haven't staked any NFT yet!</p>
							)}
							<p>Total Supply: {nfts.totalSupply}</p>
							<p>Max per Wallet: 10</p>
							<div className="flex justify-evenly gap-4 mt-4">
								<button
									disabled={nfts.balance >= 10}
									onClick={() => mintNFT()}
									className={`px-10 py-1 text-lg border-none rounded-md ${
										nfts.balance >= 10 ? "cursor-not-allowed bg-teal-200 text-teal-700" : "bg-teal-600 text-white"
									}`}>
									Mint NFT
								</button>
								{isNFTsApproved ? (
									<>
										<button
											disabled={nfts.balance === 0}
											onClick={() => stakeNFT([nfts.gold[0]])}
											className={`px-10 py-1 text-lg border-none rounded-md ${
												nfts.balance === 0 ? "cursor-not-allowed bg-teal-200 text-teal-700" : "bg-teal-600 text-white"
											}`}>
											Stake NFT
										</button>
										<button
											disabled={nfts.staked.length === 0}
											onClick={() => unstakeNFTs()}
											className={`px-10 py-1 text-lg border-none rounded-md ${
												nfts.staked.length === 0
													? "cursor-not-allowed bg-teal-200 text-teal-700"
													: "bg-teal-600 text-white"
											}`}>
											Unstake NFTs
										</button>
									</>
								) : (
									<button
										disabled={nfts.balance === 0}
										onClick={() => approveNFTs()}
										className={`px-10 py-1 text-lg border-none rounded-md ${
											nfts.balance === 0 ? "cursor-not-allowed bg-teal-200 text-teal-700" : "bg-teal-600 text-white"
										}`}>
										Approve NFTs
									</button>
								)}
							</div>
						</div>
						<button onClick={() => handleLogout()} className="bg-red-500 text-white text-xl py-2 rounded-md">
							Disconnect Wallet
						</button>
					</div>
				</div>
			) : (
				<button
					onClick={() => handleSubmit()}
					className="bg-teal-600 px-2 py-1 text-white text-2xl border-none rounded-lg">
					Login
				</button>
			)}
		</div>
	);
}

export default App;
