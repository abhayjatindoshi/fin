import type React from "react";

const AccountNumber: React.FC<{ accountNumber: string }> = ({ accountNumber }) => {
    if (accountNumber.length <= 4) return accountNumber;
    return `****${accountNumber.slice(-4)}`;
}

export default AccountNumber;