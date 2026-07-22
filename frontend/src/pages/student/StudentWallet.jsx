import React, { useEffect, useState } from "react";
import { Wallet, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { studentAPI } from "../../api/studentAPI";
import toast from "react-hot-toast";

const StudentWallet = () => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const res = await studentAPI.getMyWallet();
      setWallet(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load wallet");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading wallet...</div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Wallet not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">My Wallet</h1>

        {/* Balance Card */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm mb-1">Available Balance</p>
              <p className="text-4xl font-bold">₹{wallet.balance.toFixed(2)}</p>
            </div>
            <Wallet className="w-12 h-12 text-purple-300" />
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">
              Transaction History
            </h2>
          </div>

          {wallet.transactions && wallet.transactions.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {wallet.transactions.map((txn, index) => (
                <div
                  key={index}
                  className="p-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        txn.type === "credit" ? "bg-green-100" : "bg-red-100"
                      }`}
                    >
                      {txn.type === "credit" ? (
                        <ArrowDownLeft className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {txn.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(txn.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        txn.type === "credit"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {txn.type === "credit" ? "+" : "-"}₹
                      {txn.amount.toFixed(2)}
                    </p>
                    {txn.status === "refunded" && (
                      <p className="text-xs text-gray-400">Refunded</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No transactions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentWallet;
