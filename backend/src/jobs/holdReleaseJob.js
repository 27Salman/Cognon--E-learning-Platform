const cron = require("node-cron");
const Wallet = require("../models/Wallet");
const { PLATFORM_COMMISSION } = require("../config/constants");

const round = (n) => Math.round(n * 100) / 100;

async function releaseExpiredHolds() {
  const now = new Date();

  const wallets = await Wallet.find({
    transactions: {
      $elemMatch: { status: "pending", releaseAt: { $lte: now } },
    },
  });

  let releasedCount = 0;

  for (const wallet of wallets) {
    let walletReleased = 0;

    for (const txn of wallet.transactions) {
      if (txn.status === "pending" && txn.releaseAt && txn.releaseAt <= now) {
        txn.status = "completed";

        if (wallet.ownerType === "admin") {
          const toRelease =
            txn.platformShare != null
              ? txn.platformShare
              : round(txn.amount * PLATFORM_COMMISSION.RATE);
          walletReleased = round(walletReleased + toRelease);
        } else {
          walletReleased = round(walletReleased + txn.amount);
        }
      }
    }

    if (walletReleased > 0) {
      wallet.balance = round(wallet.balance + walletReleased);
      await wallet.save();
      releasedCount++;
    }
  }

  return releasedCount;
}

function startHoldReleaseJob() {
  cron.schedule("0 0 * * *", async () => {
    console.log("[CRON] holdReleaseJob: starting daily hold release...");
    try {
      const count = await releaseExpiredHolds();
      console.log(
        `[CRON] holdReleaseJob: released holds for ${count} wallet(s)`,
      );
    } catch (err) {
      console.error("[CRON] holdReleaseJob: failed —", err.message);
    }
  });

  console.log("[CRON] holdReleaseJob: scheduled (daily at midnight)");
}

module.exports = { startHoldReleaseJob, releaseExpiredHolds };
