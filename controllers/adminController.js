const User = require("../models/User");
const Account = require("../models/Account");
const jwt = require("jsonwebtoken");
const Transaction = require("../models/TransactionHistory");
const { ObjectId } = require("mongodb");
const adminController = {

  getAdminHomePage: async(req,res) => {
    const accessToken = req.cookies.accessToken;
    const verifyToken = jwt.verify(accessToken, process.env.JWT_ACCESS_KEY);
    const user = await User.findOne({
      username: verifyToken.data.username,
    }).lean();

    let pendingUser = await Account.find({status: "pending"})
    let activatedUser = await Account.find({status: "activated"})
    let locked = await Account.find({isLocked:true})
    let pendingWithdraw = await Transaction.find({transactionType:"Withdraw", status:"Pending"})
    let pendingTransfer = await Transaction.find({transactionType:"Transfer", status:"Pending"})
    return res.render("./adminView/adminHomepage", {
      layout: "admin",
      user,
      accountStatus: req.session.accountStatus,
      pendingUserList: pendingUser.length,
      activatedUserList: activatedUser.length,
      lockedUserList: locked.length,
      pendingWithdrawList : pendingWithdraw.length,
      pendingTransferList: pendingTransfer.length
    });
  },


  getProfile: async (req, res, next) => {
    if (req.session.isLogin) {
      const user = await User.findOne({ username: req.session.username })
        .lean()
        .select("dateOfBirth phoneNumber fullName address email avatar");

      user.dateOfBirth = user.dateOfBirth
        .toLocaleString("en-GB", { timeZone: "UTC" })
        .split(",")[0];

      const account = await Account.findOne({
        username: req.session.username,
      })
        .lean()
        .select("balance status history username");

      return res.render("profile", {
        layout: "admin",
        user,
        account,
        accountStatus: req.session.accountStatus,
      });
    } else {
      return res.redirect("/login");
    }
  },

  getPending: async (req, res) => {
    const accessToken = req.cookies.accessToken;
    const verifyToken = jwt.verify(accessToken, process.env.JWT_ACCESS_KEY);
    const user = await User.findOne({
      username: verifyToken.data.username,
    }).lean();

    let pendingAccount = await Account.find({ status: "pending" })
      .lean()
      .select("username");

    let pendingUser = [];

    pendingAccount.forEach((userData) => {
      pendingUser.push(userData.username);
    });
    if (req.query.search == "true") {
      User.find({
        $and: [
          { username: { $in: pendingUser } },
          generateSearchUserFilter(req),
        ],
      })
        .sort({ createAt: -1 })
        .lean()
        .exec((err, result) => {
          if (err !== null) {
            res.redirect("/admin/pending");
          } else {
            let noData = {
              status: true,
              msg: "Không có kết quả",
            };

            if (result.length >= 1) {
              noData.status = false;
              result.forEach((userData) => {
                userData.createAt = userData["createAt"]
                  .toLocaleString("en-GB", { timeZone: "UTC" })
                  .replace(",", " -");
              });
            }
            return res.render("./adminView/pending", {
              layout: "admin",
              user,
              noData: noData,
              pendingUsers: result,
              accountStatus: req.session.accountStatus,
            });
          }
        });
    } else {
      User.find({ username: { $in: pendingUser } })
        .sort({ createAt: -1 })
        .lean()
        .exec((err, result) => {
          let noData = {
            status: true,
            msg: "Không có tài khoản chờ duyệt",
          };

          if (result.length >= 1) {
            noData.status = false;
            result.forEach((userData) => {
              userData.createAt = userData["createAt"]
                .toLocaleString("en-GB", { timeZone: "UTC" })
                .replace(",", " -");
            });
          }
          return res.render("./adminView/pending", {
            layout: "admin",
            user,
            noData: noData,
            pendingUsers: result,
            accountStatus: req.session.accountStatus,
          });
        });
    }
  },
  getActive: async (req, res) => {
    const accessToken = req.cookies.accessToken;
    const verifyToken = jwt.verify(accessToken, process.env.JWT_ACCESS_KEY);
    const user = await User.findOne({
      username: verifyToken.data.username,
    }).lean();

    let pendingAccount = await Account.find({ status: "activated" })
      .lean()
      .select("username");

    let pendingUser = [];

    pendingAccount.forEach((userData) => {
      pendingUser.push(userData.username);
    });
    if (req.query.search == "true") {
      User.find({
        $and: [
          { username: { $in: pendingUser } },
          generateSearchUserFilter(req),
        ],
      })
        .sort({ createAt: -1 })
        .lean()
        .exec((err, result) => {
          if (err !== null) {
            res.redirect("/admin/pending");
          } else {
            let noData = {
              status: true,
              msg: "Không có kết quả",
            };

            if (result.length >= 1) {
              noData.status = false;
              result.forEach((userData) => {
                userData.createAt = userData["createAt"]
                  .toLocaleString("en-GB", { timeZone: "UTC" })
                  .replace(",", " -");
              });
            }
            return res.render("./adminView/activated", {
              layout: "admin",
              user,
              noData: noData,
              pendingUsers: result,
              accountStatus: req.session.accountStatus,
            });
          }
        });
    } else {
      User.find({ username: { $in: pendingUser } })
        .sort({ createAt: -1 })
        .lean()
        .exec((err, result) => {
          let noData = {
            status: true,
            msg: "Không có tài khoản nào được kích hoạt",
          };

          if (result.length >= 1) {
            noData.status = false;
            result.forEach((userData) => {
              userData.createAt = userData["createAt"]
                .toLocaleString("en-GB", { timeZone: "UTC" })
                .replace(",", " -");
            });
          }
          return res.render("./adminView/activated", {
            layout: "admin",
            user,
            noData: noData,
            pendingUsers: result,
            accountStatus: req.session.accountStatus,
          });
        });
    }
  },
  getDisabled: async (req, res) => {
    const disableAccounts = await Account.find({ status: "disable" });
    let disabledUsers = [];
    const accessToken = req.cookies.accessToken;
    const verifyToken = jwt.verify(accessToken, process.env.JWT_ACCESS_KEY);
    const user = await User.findOne({ username: verifyToken.data.username });
    for (let item of disableAccounts) {
      disabledUsers.push(
        await User.findOne({ username: item.username }).lean()
      );
    }
    return res.render("disabled", {
      layout: "admin",
      user,
      disabledUsers,
      accountStatus: req.session.accountStatus,
    });
  },

  activated: async (req, res) => {
    try {
      let account = await Account.findOne({ username: req.params.username });
      if (account) {
        await account.updateOne({ status: "activated" });
      }
      return res.redirect("/admin/pending");
    } catch (error) {
      console.log(error);
      return res.redirect("/admin/pending");
    }
  },
  disabled: async (req, res) => {
    try {
      const account = await Account.findOne({ username: req.params.username });
      if (account) {
        await account.updateOne({ status: "disabled" });
      }
      return res.redirect("/admin/pending");
    } catch (error) {
      console.log(error);
      return res.render("404", { layout: "blankLayout" });
    }
  },
  addInfo: async (req, res) => {
    try {
      const account = await Account.findOne({ username: req.params.username });
      if (account) {
        await account.updateOne({ status: "waiting update" });
      }
      return res.redirect("/admin/pending");
    } catch (error) {
      console.log(error);
      return res.render("404", { layout: "blankLayout" });
    }
  },

  getUserDetail: async (req, res) => {
    try {
      let user = await User.findOne({ username: req.session.username }).lean(); // admin profile
      let pendinguser = await User.findOne({
        username: req.params.username,
      }).lean();
      let account = await Account.findOne({
        username: req.params.username,
      })
        .lean()
        .select("balance status history username");
      pendinguser.dateOfBirth = pendinguser["dateOfBirth"]
        .toLocaleString("en-GB", { timeZone: "UTC" })
        .split(",")[0];
      pendinguser.createAt = pendinguser["createAt"]
        .toLocaleString("en-GB", { timeZone: "UTC" })
        .replace(",", "-");
      let ispending = false
      if(account.status.toLowerCase() == 'pending')
      {
        ispending = true
      }
      return res.render("./adminView/accountDetail", {
        layout: "admin",
        user,
        ...pendinguser,
        accountStatus: req.session.accountStatus,
        ispending: ispending
      });
    } catch {
      console.log(error);
      return res.redirect("/admin/");
    }
  },

  getPendingTransaction: async (req, res) => {
    const accessToken = req.cookies.accessToken;
    const verifyToken = jwt.verify(accessToken, process.env.JWT_ACCESS_KEY);
    const user = await User.findOne({
      username: verifyToken.data.username,
    }).lean();
    if (req.query.search == "true") {
      Transaction.find(generateSearchTransactionFilter(req))
        .sort({ transactionDate: -1 })
        .lean()
        .exec((err, result) => {
          if (err !== null) {
            res.redirect("/admin/transactionApproval");
          } else {
            let noData = {
              status: true,
              msg: "Không có kết quả",
            };
            if (result.length >= 1) {
              result.forEach((transaction) => {
                transaction.transactionDate = transaction["transactionDate"]
                  .toLocaleString("en-GB", { timeZone: "UTC" })
                  .replace(",", " -");
                transaction.transactionAmount = toMoney(
                  transaction.transactionAmount
                );
                if (transaction.status.toLowerCase() === "pending") {
                  transaction.status = "Chờ duyệt";
                } else {
                  transaction.status = "Trạng thái khác";
                }
              });
              noData.status = false;
            }
            return res.render("./adminView/transactionApproval", {
              layout: "admin",
              user,
              noData: noData,
              pendingTransaction: result,
              accountStatus: req.session.accountStatus,
            });
          }
        });
    } else {
      Transaction.find({ transactionType:"Withdraw",status: "Pending" })
        .sort({ transactionDate: -1 })
        .lean()
        .exec((err, result) => {
          let noData = {
            status: true,
            msg: "Không có giao dịch cần duyệt",
          };
          if (result.length >= 1) {
            result.forEach((transaction) => {
              transaction.transactionDate = transaction["transactionDate"]
                .toLocaleString("en-GB", { timeZone: "UTC" })
                .replace(",", " -");
              transaction.transactionAmount = toMoney(
                transaction.transactionAmount
              );
              if (transaction.status.toLowerCase() === "pending") {
                transaction.status = "Chờ duyệt";
              } else {
                transaction.status = "Trạng thái khác";
              }
            });
            noData.status = false;
          }
          return res.render("./adminView/transactionApproval", {
            layout: "admin",
            user,
            noData: noData,
            pendingTransaction: result,
            accountStatus: req.session.accountStatus,
          });
        });
    }
  },

  getPendingWithdrawDetail: async (req, res) => {
    try {
      let user = await User.findOne({ username: req.session.username }).lean();
      Transaction.findOne({ _id: new ObjectId(req.params.transactionID) })
        .lean()
        .exec((err, result) => {
          if (result !== null) {
            result.transactionDate = result["transactionDate"]
              .toLocaleString("en-GB", { timeZone: "UTC" })
              .replace(",", " -");
            result.transactionAmount = toMoney(result.transactionAmount);
            result.transactionFee = toMoney(result.transactionFee);
            if (result.status.toLowerCase() === "pending") {
              result.status = "Chờ duyệt";
            } else {
              result.status = "Trạng thái khác";
            }
            return res.render("./adminView/withdrawDetail", {
              layout: "admin",
              user,
              accountStatus: req.session.accountStatus,
              pendingTransaction: result,
            });
          } else {
            return res.redirect("/admin/pending");
          }
        });
    } catch (error) {
      console.log(error);
      return res.redirect("/admin/pending");
    }
  },

  acceptWithdrawTransaction: async (req, res) => {
    try {
      let processedTransaction = await Transaction.findOne({
        _id: new ObjectId(req.body.transactionID),
      });
      let processedAccount = await Account.findOne({
        username: processedTransaction.userID,
      });

      if (!processedTransaction || !processedAccount) {
        throw "Thiếu dữ liệu giao dịch và dữ liệu người dùng."
      }
      await processedAccount.updateOne({ //Update account balance
        $inc: {
          balance:-processedTransaction.transactionAmount -processedTransaction.transactionFee ,
        },
      });
      await processedTransaction.updateOne({ //Update transaction status
        status: "Success",
        describe: `Số tiền giao dịch: -${toMoney(
          processedTransaction.transactionAmount
        )}<br>Phí rút tiền: ${toMoney(
          processedTransaction.transactionFee
        )}<br>Số dư hiện tại: ${toMoney(processedAccount.balance - processedTransaction.transactionAmount -processedTransaction.transactionFee)}`,
      });
      return res.redirect("/admin/transactionApproval/withdraw");

      // console.log(pendingWithdraw.obj)
    } catch (error) {
      console.log(error);
      return res.redirect("/admin/transactionApproval/withdraw");
    }
  },

  searchPendingTransaction: (req, res) => {
    if (req.query.search == "true") {
      Transaction.find(generateSearchTransactionFilter(req))
        .sort({ transactionDate: -1 })
        .lean()
        .exec((err, result) => {
          if (err !== null) {
            return res.json({ msg: "Xảy ra lỗi trong quá trình tìm kiếm" });
          } else {
            if (result.length >= 1) {
              result.forEach((transaction) => {
                transaction.transactionDate = transaction["transactionDate"]
                  .toLocaleString("en-GB", { timeZone: "UTC" })
                  .replace(",", " -");
                transaction.transactionAmount = toMoney(
                  transaction.transactionAmount
                );
              });
              return res.json({ dataFound: result.length, result });
            } else {
              return res.json({ msg: "Không có kết quả" });
            }
          }
        });
    } else {
      return res.json({ msg: "Tìm kiếm không hợp lệ" });
    }
  },

  searchPendingUser: async (req, res) => {
    if (req.query.search == "true") {
      let account = await Account.find({ status: "pending" })
        .lean()
        .select("username");
      let pendingAccount = [];

      account.forEach((user) => {
        pendingAccount.push(user.username);
      });
      User.find({
        $and: [
          { username: { $in: pendingAccount } },
          generateSearchUserFilter(req),
        ],
      })
        .sort({ createAt: -1 })
        .lean()
        .exec((err, result) => {
          if (err !== null) {
            return res.json({ msg: "Xảy ra lỗi trong quá trình tìm kiếm" });
          } else {
            if (result.length >= 1) {
              return res.json({ dataFound: result.length, result });
            } else {
              return res.json({ msg: "Không có kết quả" });
            }
          }
        });
    } else {
      return res.json({ msg: "Tìm kiếm không hợp lệ" });
    }
  },
  searchActiveUser: async (req, res) => {
    if (req.query.search == "true") {
      let account = await Account.find({ status: "activated" })
        .lean()
        .select("username");
      let pendingAccount = [];

      account.forEach((user) => {
        pendingAccount.push(user.username);
      });
      User.find({
        $and: [
          { username: { $in: pendingAccount } },
          generateSearchUserFilter(req),
        ],
      })
        .sort({ createAt: -1 })
        .lean()
        .exec((err, result) => {
          if (err !== null) {
            return res.json({ msg: "Xảy ra lỗi trong quá trình tìm kiếm" });
          } else {
            if (result.length >= 1) {
              return res.json({ dataFound: result.length, result });
            } else {
              return res.json({ msg: "Không có kết quả" });
            }
          }
        });
    } else {
      return res.json({ msg: "Tìm kiếm không hợp lệ" });
    }
  },
};

module.exports = adminController;

function toMoney(moneyamount, style = "VND") {
  return (
    parseFloat(moneyamount).toLocaleString("en-US", {
      maximumFractionDigits: 2,
    }) +
    " " +
    style
  );
}

function generateSearchTransactionFilter(req) {
  let filter = {
    transactionType: "Withdraw",
    status: "Pending",
  };
  if (req.query.ID) {
    filter.userID = req.query.ID;
  }
  if (req.query.from && req.query.to) {
    filter.transactionDate = {
      $gte: new Date(req.query.from),
      $lt: new Date(req.query.to),
    };
  } else if (req.query.from && !req.query.to) {
    filter.transactionDate = { $gte: new Date(req.query.from) };
  } else if (!req.query.from && req.query.to) {
    filter.transactionDate = { $lt: new Date(req.query.to) };
  }
  if (req.query.amount && req.query.amount >= 5) {
    let realAmount = req.query.amount * 1000000;
    filter.transactionAmount = { $gte: realAmount };
  }

  return filter;
}

function generateSearchUserFilter(req) {
  let filter = {};
  if (req.query.searchString && req.query.searchType == 1) {
    filter.username = req.query.searchString;
  } else if (req.query.searchString && req.query.searchType == 2) {
    filter.phoneNumber = req.query.searchString;
  } else if (req.query.searchString && req.query.searchType == 3) {
    filter.email = req.query.searchString;
  }
  return filter;
}
