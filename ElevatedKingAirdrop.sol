// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <=0.8.24;
import "./ElevatedKing.sol";

contract ElevatedKingAirdrop {
    ElevatedKing public kingToken;
    uint256 public totalAirdrop = 280 * 10**18; // 280 KING tokens

    address public owner;
    mapping(address => uint256) public allocations;
    mapping(address => bool) public hasClaimed;

    event AirdropClaimed(address indexed recipient, uint256 amount);
    event AirdropFunded(uint256 amount);
    event AddressWhitelisted(address indexed wallet, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not contract owner");
        _;
    }

    constructor(address _kingToken) {
        kingToken = ElevatedKing(_kingToken);
        owner = msg.sender;
    }

    function fundAirdrop() external onlyOwner {
        require(kingToken.balanceOf(msg.sender) >= totalAirdrop, "Not enough tokens");
        require(kingToken.transferFrom(msg.sender, address(this), totalAirdrop), "Funding failed");
        emit AirdropFunded(totalAirdrop);
    }

    function whitelistAddresses(address[] calldata wallets, uint256[] calldata amounts) external onlyOwner {
        require(wallets.length == amounts.length, "Mismatched inputs");
        for (uint256 i = 0; i < wallets.length; i++) {
            allocations[wallets[i]] = amounts[i] * 10**18;
            emit AddressWhitelisted(wallets[i], amounts[i] * 10**18);
        }
    }

    function claimAirdrop() external {
        require(allocations[msg.sender] > 0, "No airdrop allocation");
        require(!hasClaimed[msg.sender], "Already claimed");

        uint256 amount = allocations[msg.sender];
        hasClaimed[msg.sender] = true;
        allocations[msg.sender] = 0;

        require(kingToken.transfer(msg.sender, amount), "Transfer failed");
        emit AirdropClaimed(msg.sender, amount);
    }
}
