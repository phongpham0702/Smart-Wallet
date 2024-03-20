const User = require("../models/User");
const formidable = require("formidable");
const async = require("hbs/lib/async");
const jwt = require("jsonwebtoken");
const Card = require("../models/Card");
const Transaction = require("../models/TransactionHistory");
const Account = require("../models/Account");
const uploadDir = __dirname + "/../public/images/uploads";
const mailer = require("./sendMail");
const { Cookie } = require("express-session");
const session = require("express-session");
const { ObjectId } = require("mongodb");
//This function will generate a current date time
function generateLocalDate() {
  let d = new Date();
  let currentDate = new Date(Date.now() - d.getTimezoneOffset() * 60 * 1000);
  return currentDate;
}

//This function will turn number to money format
function toMoney(moneyamount, style = " VND") {
  return (
    parseFloat(moneyamount).toLocaleString("en-US", {
      maximumFractionDigits: 2,
    }) +style
  );
}

//This function help to return to view with some option
function backToInputForm(view, user, res, error, dataBag,req) {

  let option = {
    layout: "main",
    user: user.toObject(),
    error: error,
    ...dataBag,
    accountStatus:req.session.accountStatus
  }
  if(view == 'deposit'){option.depositButton = true}
  if(view == 'withdraw'){option.withdrawButton = true}
  if(view == 'transfer'){option.transferButton = true}
  if(view == 'buyphonecard'){option.buyButton = true}
  return res.render(view, option);
}

async function makeDeposit(user, userAccount, req, res, error, dataBag) {
  if (parseFloat(req.body.amount) <= 0) {
    error.isError = true;
    error.errorMessage = "Số tiền giao dịch không hợp lệ";
    return backToInputForm("deposit", user, res, error, dataBag,req);
  }
  Account.updateOne(
    { username: user.username },
    { $inc: { balance: req.body.amount } },
    async (err, result) => {
      if (err || result["modifiedCount"] < 1) {
        error.isError = true;
        error.errorMessage =
          "Có lỗi xảy ra trong quá trình thực hiện. Vui lòng thử lại.<br>";
        return backToInputForm("deposit", user, res, error, dataBag,req);
      } else {
        await Transaction.create({
          userID: user.username,
          transactionType: "Deposit",
          transactionDate: generateLocalDate(),
          transactionAmount: req.body.amount,
          status: "Success",
          describe: `Số tiền giao dịch: +${toMoney(
            req.body.amount
          )}<br>Số dư hiện tại: ${toMoney(
            parseInt(userAccount.balance) + parseInt(req.body.amount)
          )}`,
        });
        return res.redirect("/transaction");;
      }
    }
  );
}

async function makeWithdraw(
  user,
  userAccount,
  req,
  res,
  error,
  dataBag,
  amountWithFee
) {
  if (parseFloat(req.body.amount) <= 0) {
    error.isError = true;
    error.errorMessage = "Số tiền giao dịch không hợp lệ";
    return backToInputForm("withdraw", user, res, error, dataBag,req);
  }

  if (parseFloat(req.body.amount) < 5000000) {
    Account.updateOne(
      { username: user.username },
      { $inc: { balance: (amountWithFee * -1), remainWithDrawPerDay: -1 } },
      async (err, result) => {
        if (err || result["modifiedCount"] < 1) {
          error.isError = true;
          error.errorMessage =
            "Có lỗi xảy ra trong quá trình thực hiện. Vui lòng thử lại.<br>";
          return backToInputForm("withdraw", user, res, error, dataBag,req);
        } else {
          await Transaction.create({
            userID: user.username,
            transactionType: "Withdraw",
            transactionDate: generateLocalDate(),
            transactionAmount: req.body.amount,
            transactionFee: (req.body.amount*5)/100,
            status: "Success",
            describe: `Số tiền giao dịch: -${toMoney(
              req.body.amount
            )}<br>Phí rút tiền: ${toMoney(
              (req.body.amount * 5) / 100
            )}<br>Số dư hiện tại: ${toMoney(
              parseFloat(userAccount.balance) - parseFloat(amountWithFee)
            )}`,
            note: req.body.note
          });
          return res.redirect("/transaction");;
        }
      }
    );
  } else {
    await Account.updateOne({ username: user.username },{ $inc: {remainWithDrawPerDay: -1 }})
    await Transaction.create({
      userID: user.username,
      transactionType: "Withdraw",
      transactionDate: generateLocalDate(),
      transactionAmount: req.body.amount,
      transactionFee: (req.body.amount*5)/100,
      status: "Pending",
      describe: `Yêu cầu giao dịch đã được ghi nhận. Do số tiền lớn hơn 5.000.000đ nên vui lòng đợi được duyệt`,
      note: req.body.note
    });

    //So tien giao dich: -${toMoney(req.body.amount)}\nPhi rut tien: ${toMoney((req.body.amount * 5) / 100)}\nSo du hien tai: ${toMoney(parseFloat(userAccount.balance) - parseFloat(amountWithFee))}\nGhi chu: ${req.body.note}
    return res.redirect("/transaction");;
  }
}
module.exports = {
  getDepositForm: async (req, res, next) => {
    if (!req.session.isLogin) {
      return res.redirect("/login");
    } else {
      const accessToken = req.cookies.accessToken;
      const verifyToken = jwt.verify(accessToken, process.env.JWT_ACCESS_KEY);
      let user = await User.findOne({ username: verifyToken.data.username });
      return res.render("deposit", {
        layout: "main",
        user: user.toObject(),
        depositButton: true,
        accountStatus:req.session.accountStatus
      });
    }
  },

  postDepositForm: async (req, res) => {
    if (!req.session.isLogin) {
      return res.redirect("/login");
    } else {
      const accessToken = req.cookies.accessToken;
      const verifyToken = jwt.verify(accessToken, process.env.JWT_ACCESS_KEY);
      let user = await User.findOne({ username: verifyToken.data.username });
      let error = {
        isError: false,
        errorMessage: "",
      };
      let dataBag = {
        preCardNumber: req.body.cardNumber,
        preCVV: req.body.cvv,
        preExp: req.body.exp,
      };
      if (
        req.body.cardNumber === "" ||
        req.body.exp === "" ||
        req.body.cvv === "" ||
        req.body.amount === ""
      ) {
        error.isError = true;
        error.errorMessage = "Vui lòng điền đủ thông tin";
        return backToInputForm("deposit", user, res, error, dataBag,req);
      }

      Card.findOne({ cardNumber: req.body.cardNumber }, async (err, data) => {
        if (data === null) {
          error.isError = true;
          error.errorMessage = "Số thẻ này không tồn tại";
          return backToInputForm("deposit", user, res, error, dataBag,req);
        }
        if (req.body.cvv !== data["CVVcode"]) {
          error.isError = true;
          error.errorMessage = "Mã CVV không trùng khớp<br>";
        }

        if (req.body.exp != data["expireDate"]) {
          error.isError = true;
          error.errorMessage = error.errorMessage +=
            "Ngày hết hạn trùng khớp<br>";
        }

        if (error.isError) {
          return backToInputForm("deposit", user, res, error, dataBag,req);
        } else {
          let userAccount = await Account.findOne(
            { username: user.username },
            { balance: 1 }
          );
          switch (req.body.cardNumber) {
            case "111111":
              return makeDeposit(user, userAccount, req, res, error, dataBag,req);

            case "222222":
              if (req.body.amount > 1000000) {
                error.isError = true;
                error.errorMessage =
                  "Thẻ 222222 chỉ được nạp tối đa 1 triệu/lần";
                return backToInputForm("deposit", user, res, error, dataBag,req);
              } else {
                return makeDeposit(user, userAccount, req, res, error, dataBag,req);
              }

            case "333333":
              error.isError = true;
              error.errorMessage = "Thẻ 333333 đã hết tiền";
              return backToInputForm("deposit", user, res, error, dataBag,req);
          }
        }
      });
    }
  },

  getWithdrawForm: async (req, res, next) => {
    if (!req.session.isLogin) {
      return res.redirect("/login");
    } else {
      const accessToken = req.cookies.accessToken;
      const verifyToken = jwt.verify(accessToken, process.env.JWT_ACCESS_KEY);
      let user = await User.findOne({ username: verifyToken.data.username });
      return res.render("withdraw", {
        layout: "main",
        user: user.toObject(),
        withdrawButton: true,
        accountStatus:req.session.accountStatus
      });
    }
  },

  postWithdrawForm: async (req, res, next) => {
    if (!req.session.isLogin) {
      return res.redirect("/login");
    } else {
      const accessToken = req.cookies.accessToken;
      const verifyToken = jwt.verify(accessToken, process.env.JWT_ACCESS_KEY);
      let user = await User.findOne({ username: verifyToken.data.username });
      let error = {
        isError: false,
        errorMessage: "",
      };
      let dataBag = {
        preCardNumber: req.body.cardNumber,
        preCVV: req.body.cvv,
        preExp: req.body.exp,
        preNote: req.body.note,
      };
      if (
        req.body.cardNumber === "" ||
        req.body.exp === "" ||
        req.body.cvv === "" ||
        req.body.amount === "" ||
        req.body.note === ""
      ) {
        error.isError = true;
        error.errorMessage = "Vui lòng điền đủ thông tin";
        return backToInputForm("withdraw", user, res, error, dataBag,req);
      }

      if (req.body.cardNumber !== "111111") {
        error.isError = true;
        error.errorMessage = "Thẻ này không được hỗ trợ rút tiền";
        return backToInputForm("withdraw", user, res, error, dataBag,req);
      }

      Card.findOne({ cardNumber: req.body.cardNumber }, async (err, data) => {
        if (data === null) {
          error.isError = true;
          error.errorMessage = "Số thẻ này không tồn tại";
          return backToInputForm("withdraw", user, res, error, dataBag,req);
        }
        if (req.body.cvv !== data["CVVcode"]) {
          error.isError = true;
          error.errorMessage = "Mã CVV không trùng khớp<br>";
        }

        if (req.body.exp != data["expireDate"]) {
          error.isError = true;
          error.errorMessage = error.errorMessage +=
            "Ngày hết hạn trùng khớp<br>";
        }

        if (error.isError) {
          return backToInputForm("withdraw", user, res, error, dataBag,req);
        } else {
          let userAccount = await Account.findOne(
            { username: user.username },
            { balance: 1, remainWithDrawPerDay: 1 }
          );

          if (userAccount.remainWithDrawPerDay <= 0) {
            error.isError = true;
            error.errorMessage = "Bạn đã hết số lần rút tiền hôm nay";
            return backToInputForm("withdraw", user, res, error, dataBag,req);
          } else {
            let amountWithFee =
              parseFloat(req.body.amount) + (req.body.amount * 5) / 100;

            if (parseFloat(req.body.amount) % 50000 !== 0) {
              error.isError = true;
              error.errorMessage =
                "Số tiền rút mỗi lần phải là bội số của 50,000đ";
              return backToInputForm("withdraw", user, res, error, dataBag,req);
            }
            if(userAccount.balance < req.body.amount)
            {
              error.isError = true;
              error.errorMessage = "Số dư không đủ để thực hiện";
              return backToInputForm("withdraw", user, res, error, dataBag,req);
            }
            if (userAccount.balance < amountWithFee) {
              error.isError = true;
              error.errorMessage = "Số dư không đủ để trả 5% phí rút tiền";
              return backToInputForm("withdraw", user, res, error, dataBag,req);
            }

            return makeWithdraw(
              user,
              userAccount,
              req,
              res,
              error,
              dataBag,
              amountWithFee
            );
          }
        }
      });
    }
  },

  getTransferForm: async (req, res, next) => {
    if (!req.session.isLogin) {
      return res.redirect("/logout");
    } else {
      req.session.verifyOTP = null;
      req.session.otpExpire = null;
      req.session.dataBag = null;
      const accessToken = req.cookies.accessToken;
      const verifyToken = jwt.verify(accessToken, process.env.JWT_ACCESS_KEY);
      let user = await User.findOne({ username: verifyToken.data.username });
      return res.render("transfer", {
        layout: "main",
        user: user.toObject(),
        transferButton: true,
        accountStatus:req.session.accountStatus,
        preNote: user.fullName+ " chuyển tiền"
      });
    }
  },

  getBuyPhoneCardForm: async (req, res, next) => {
    if (!req.session.isLogin) {
      return res.redirect("/login");
    } else {
      const accessToken = req.cookies.accessToken;
      const verifyToken = jwt.verify(accessToken, process.env.JWT_ACCESS_KEY);
      let user = await User.findOne({ username: verifyToken.data.username });
      return res.render("buyphonecard", {

        layout: "main",
        user: user.toObject(),
        buyButton: true,
        accountStatus:req.session.accountStatus
      });
    }
  },
  getTransactionHistory: async (req, res, next) => {
    if (!req.session.isLogin) {
      return res.redirect("/login");
    } else {
      const accessToken = req.cookies.accessToken;
      const verifyToken = jwt.verify(accessToken, process.env.JWT_ACCESS_KEY);
      let user = await User.findOne({ username: verifyToken.data.username });
      let userTransaction = await Transaction.find({userID: user.username})
      .sort({ transactionDate: -1 })
      .lean()
      
      let noData = {
        status: true,
        msg: "Không có giao dịch cần duyệt",
      };
      if (userTransaction.length >= 1) {
        userTransaction.forEach((transaction) => {
          transaction.transactionDate = transaction["transactionDate"]
            .toLocaleString("en-GB", { timeZone: "UTC" })
            .replace(",", " -");
          transaction.transactionAmount = toMoney(
            transaction.transactionAmount
          );
          if (transaction.status.toLowerCase() === "pending") {
            transaction.status = "Chờ duyệt";
          } else if(transaction.status.toLowerCase() === "fail") {
            transaction.status = "Thất bại";
          }
          else{transaction.status = "Thành công";}

          if(transaction.transactionType.toLowerCase() === "deposit")
          {
            transaction.transactionType ="Nạp tiền"
          }else if(transaction.transactionType.toLowerCase() === "withdraw")
          {transaction.transactionType ="Rút tiền"}
          else if(transaction.transactionType.toLowerCase() === "transfer")
          {transaction.transactionType ="Chuyển tiền"}
          else if(transaction.transactionType.toLowerCase() === "buy")
          {transaction.transactionType ="Mua thẻ"}
          else{transaction.transactionType ="Nhận tiền"}
        });
        noData.status = false;
      }
      return res.render("userTransactionHistory", {
        layout: "main",
        user: user.toObject(),
        transactionButton: true,
        noData: noData,
        pendingTransaction: userTransaction,
        accountStatus:req.session.accountStatus
      });
    }
  },
  getProfile: async (req, res, next) => {
    if (req.session.isLogin) {
      const user = await User.findOne({ username: req.session.username })
        .lean()
        .select("dateOfBirth phoneNumber fullName address email avatar");

      user.dateOfBirth = user.dateOfBirth.toLocaleString("en-GB",{timeZone:'UTC'}).split(",")[0];

      const account = await Account.findOne({
        username: req.session.username,
      })
        .lean()
        .select("balance status history username");

      if (account.status === "pending") {
        account.status = "Đang chờ duyệt";
      } else if (account.status === "activated") {
        account.status = "Đã xác thực";
      } else if (account.status === "addition") {
        account.status = "Chờ bổ sung thêm thông tin";
      }
      return res.render("profile", { layout: "main", user, account,accountStatus:req.session.accountStatus });
    } else {
      return res.redirect("/login");
    }
  },

  getForgotPasswordForm:(req,res) =>{
    req.session.destroy() //reset session
    res.render("forgotPassword", {  layout: "blankLayout" });
  },

  getOTPForm:(req,res) => {
    if(req.session.receiveOTPEmail && req.session.verifyOTP && req.session.otpExpire)
    {
      let otpExpire = new Date(req.session.otpExpire)
      let current = generateLocalDate()
      let timeBetweenExpAndCurr = new Date(otpExpire-current) 
      let remainTime = timeBetweenExpAndCurr.getMinutes() * 60000 + timeBetweenExpAndCurr.getSeconds()*1000; // turn time into millisecond
      if(otpExpire <= current)
      {
        return res.render("enterOTP", {  layout: "blankLayout",receiveOTPEmail:req.session.receiveOTPEmail,expireTime:0});
      }
      return res.render("enterOTP", {  layout: "blankLayout",receiveOTPEmail:req.session.receiveOTPEmail,expireTime:remainTime});
           
    }
    else
    {
      return res.redirect("/users/forgotpassword")
    }
  },
  postForgotPasswordForm:(req,res) => {
    
    if(req.body.receiveOTPEmail === "")
    {
      return res.render("forgotPassword", {  layout: "blankLayout", error:"Vui lòng nhập email"});
    }
    else
    {
        User.findOne({email: req.body.receiveOTPEmail}, async(err,result) =>{
        
        if(err !== null)
        {
          return res.render("forgotPassword", {  layout: "blankLayout", error:"Xảy ra lỗi trong việc tìm kiếm. Vui lòng thử lại" });
        }
        else
        {
          
          if(result === null)
          {
            return res.render("forgotPassword", {  layout: "blankLayout", error:"Email chưa được đăng ký"});
          }
          else
          {
            
            let otp = '';
            let otpExpire = generateLocalDate()
            for(let i = 0 ; i <= 5 ; i++) // random OTP character
            {
              otp+= Math.floor(Math.random()*9)
            }

            req.session.verifyOTP = otp
            req.session.otpExpire = otpExpire.setMinutes(otpExpire.getMinutes() + 1.5) // set otp expire time = current + 1.5 minutes (0.5 mins for handle time)
            req.session.receiveOTPEmail = req.body.receiveOTPEmail
            
            await mailer.sendMail(req.body.receiveOTPEmail, 'Smart Wallet System', "Mã OTP khôi phục mật khẩu: "+otp)
            return res.redirect("/users/recover")
          
          }
        }

      }).select("username")
    }
    
  },
  postOTPResetPassword: (req,res)=>{
      
    if(req.session.receiveOTPEmail && req.session.verifyOTP && req.session.otpExpire)
    {
      let otpExpire = new Date(req.session.otpExpire)
      let current = generateLocalDate()
      let timeBetweenExpAndCurr = new Date(otpExpire-current)
      let remainTime = timeBetweenExpAndCurr.getMinutes() * 60000 + timeBetweenExpAndCurr.getSeconds()*1000;
      // 1 minute = 60000ms , 1second= 1000ms
 
      if((current < otpExpire) && (req.session.verifyOTP === req.body.fullOTP))
      {
        req.session.verifyOTP = undefined;
        req.session.otpExpire = undefined;
        req.session.resetPassword = true;
        return res.redirect("/resetPassword");
      }
      else if((current < otpExpire) && (req.session.verifyOTP !== req.body.fullOTP))
      {
        
        return res.render("enterOTP", { layout: "blankLayout",receiveOTPEmail:req.session.receiveOTPEmail,expireTime:remainTime,response:"Mã OTP không hợp lệ" });
      }
      else
      {
        return res.render("enterOTP", { layout: "blankLayout",receiveOTPEmail:req.session.receiveOTPEmail,expireTime:0,response:"Mã OTP đã hết hạn" });
      }
    }
    else
    {
      return res.redirect("/users/forgotpassword")
    }
           
  },


  getUserNameByPhoneNumber:(req,res) => {

    try {
        User.findOne({phoneNumber: req.body.phoneNumber}, (err,result) =>{

          if(result)
          {
           return res.json({receiverName: result.fullName})
          }
          return res.json({msg:"Số điện thoại này không tồn tại"})

        })
    } catch (error) {
      return res.json({ msg: "Không có kết quả" });
    }
    
  },

  postTransferForm: async (req,res) => {
    try {
        if(!req.session.isLogin)
        {
          return res.redirect("/logout");
        }
        else{
          const accessToken = req.cookies.accessToken;
          const verifyToken = jwt.verify(accessToken, process.env.JWT_ACCESS_KEY);
          let user = await User.findOne({ username: verifyToken.data.username });
          let userAccount = await Account.findOne({username: user.username})
          let error = {
            isError: false,
            errorMessage: "",
          };
          let dataBag = {
            performer: req.session.username,
            prePhoneNum: req.body.receiverPhoneNumber,
            preAmount: req.body.amount,
            preNote: req.body.note,
            preBearer: req.body.bearer
          };
          if(req.body.receiverPhoneNumber === '' || req.body.amount === '' || req.body.bearer ==='')
          {
            error.isError = true;
            error.errorMessage = "Vui lòng điền đủ thông tin";
            return backToInputForm("transfer", user, res, error, dataBag,req);
          }
          if(req.body.receiverPhoneNumber === user.phoneNumber)
          {
            error.isError = true;
            error.errorMessage = "Bạn không thể tự chuyển khoản cho bản thân";
            return backToInputForm("transfer", user, res, error, dataBag,req);
          }
          if(parseFloat(req.body.amount) % 50000 !== 0)
          {
            error.isError = true;
            error.errorMessage = "Số tiền rút mỗi lần phải là bội số của 50,000đ";
            return backToInputForm("transfer", user, res, error, dataBag,req);
          }
          if(parseFloat(req.body.amount) <= 0)
          {
            error.isError = true;
            error.errorMessage = "Số tiền giao dịch không hợp lệ";
             return backToInputForm("transfer", user, res, error, dataBag,req);
          }
          if(userAccount.balance < req.body.amount)
            {
              error.isError = true;
              error.errorMessage = "Số dư không đủ để thực hiện";
              return backToInputForm("transfer", user, res, error, dataBag,req);
            }
          if (userAccount.balance < (parseFloat(req.body.amount) + (req.body.amount * 5) / 100)) {
            error.isError = true;
            error.errorMessage = "Số dư không đủ để trả 5% phí rút tiền";
            return backToInputForm("transfer", user, res, error, dataBag,req);
          }
          
          let otp = '';      
          for(let i = 0 ; i <= 5 ; i++) // random OTP character
          {
            otp+= Math.floor(Math.random()*9)
          }
          
          await mailer.sendMail(user.email, 'Smart Wallet System', "Mã OTP xác thực giao dịch: "+otp)

          let otpExpire = generateLocalDate()
          otpExpire = otpExpire.setMinutes(otpExpire.getMinutes() + 1.5)
          let current = generateLocalDate()
          let timeBetweenExpAndCurr = new Date(otpExpire-current) 
          let remainTime = timeBetweenExpAndCurr.getMinutes() * 60000 + timeBetweenExpAndCurr.getSeconds()*1000;
          req.session.verifyOTP = otp
          req.session.otpExpire = otpExpire
          req.session.dataBag = dataBag
          return res.render("verifyTransfer", {  layout: "blankLayout",receiveOTPEmail:user.email,expireTime:remainTime});
        }
    } catch (error) {
      console.log(error)
      return res.redirect("/logout")
    }
      
  },


  makeTransfer: async(req,res) => {
 
    try {
        if (!req.session.isLogin) {
        return res.redirect("/login");
        } 
        else
        { 
          
          let user = await User.findOne({ username: req.session.dataBag.performer });

          if(req.session.verifyOTP && req.session.otpExpire && req.session.dataBag )
          {
            let otpExpire = new Date(req.session.otpExpire)
            let current = generateLocalDate()
            let timeBetweenExpAndCurr = new Date(otpExpire-current)
            let remainTime = timeBetweenExpAndCurr.getMinutes() * 60000 + timeBetweenExpAndCurr.getSeconds()*1000;

            if((current < otpExpire) && (req.session.verifyOTP === req.body.fullOTP))
            {
              req.session.verifyOTP = undefined;
              req.session.otpExpire = undefined;
              let dataBag = req.session.dataBag
              let sender = await User.findOne({username: dataBag.performer})
              let senderAccount = await Account.findOne({username: dataBag.performer})
              let receiver = await User.findOne({phoneNumber: dataBag.prePhoneNum}).select("username fullName email")
              let receiverAccount = await Account.findOne({username: receiver.username}).select("username balance")
              if( parseFloat(dataBag.preAmount) < 5000000)
              {
                
                let senderModel = {
                  userID: sender.username,
                  transactionType:"Transfer",
                  transactionDate: generateLocalDate(),
                  transactionAmount: dataBag.preAmount,
                  status:"Success",
                  describe:`Số tiền giao dịch: -${toMoney(dataBag.preAmount)}<br>Phí chuyển khoản: ${toMoney((dataBag.preAmount * 5) / 100)}<br>Số dư hiện tại: ${toMoney(senderAccount.balance - parseFloat( dataBag.preAmount) - (dataBag.preAmount*5/100) )}`,
                  note:dataBag.preNote,
                  receiver: receiver.username,
                  feeBearer : dataBag.preBearer
                }
                let receiverModel= {
                  userID: receiver.username,
                  transactionType:"Receive",
                  transactionDate: generateLocalDate(),
                  transactionAmount: dataBag.preAmount,
                  status:"Success",
                  describe:`Số tiền giao dịch: +${toMoney(dataBag.preAmount)}<br>Số dư hiện tại: ${toMoney(receiverAccount.balance + parseFloat( dataBag.preAmount) )}`,
                  note:dataBag.preNote,
                  feeBearer : dataBag.preBearer
                }
                if(dataBag.preBearer == '0')
                {
                  let amountAddFee =  parseFloat(dataBag.preAmount) + (dataBag.preAmount * 5) / 100;
                  senderModel.transactionFee = (dataBag.preAmount*5)/100;
                  await Transaction.create([senderModel,receiverModel]);
                  await senderAccount.updateOne({$inc: { balance: ( amountAddFee * -1 )}});
                  await receiverAccount.updateOne({$inc: { balance: dataBag.preAmount}});
                  
                }
                else
                {
                  let amountMinusFee = parseFloat(dataBag.preAmount) - (dataBag.preAmount * 5) / 100;
                  senderModel.describe = `Số tiền giao dịch: -${toMoney(dataBag.preAmount)}<br>Số dư hiện tại: ${ toMoney( senderAccount.balance - parseFloat(dataBag.preAmount))}`;
                  receiverModel.transactionFee = (dataBag.preAmount*5)/100;
                  receiverModel.describe = `Số tiền giao dịch: +${toMoney(dataBag.preAmount)}<br>Phí chuyển khoản: ${toMoney((dataBag.preAmount * 5) / 100)}<br>Số dư hiện tại: ${toMoney (receiverAccount.balance + amountMinusFee)}`
                  await Transaction.create([senderModel,receiverModel])
                  await senderAccount.updateOne({$inc: { balance: parseFloat(dataBag.preAmount)*(-1) }})
                  await receiverAccount.updateOne({$inc: { balance: amountMinusFee }})
                }
                await mailer.sendMail(receiver.email,"Smart Wallet Transfer System",`Bạn đã nhận được ${toMoney(dataBag.preAmount)} từ ${sender.fullName}`)
              }
              else{        
                  await Transaction.create({

                    userID: sender.username,
                    transactionType:"Transfer",
                    transactionDate: generateLocalDate(),
                    transactionFee : (dataBag.preAmount*5)/100,
                    transactionAmount: dataBag.preAmount,
                    status:"Pending",
                    describe:`Yêu cầu giao dịch đã được ghi nhận. Do số tiền lớn hơn 5.000.000đ nên vui lòng đợi được duyệt`,
                    note:dataBag.preNote,
                    receiver: receiver.username,
                    feeBearer : dataBag.preBearer

                  }); 
              }
              return res.redirect("/transaction");
            }
            else if((current < otpExpire) && (req.session.verifyOTP !== req.body.fullOTP))
            {
              console.log("not correct")
              return res.render("verifyTransfer", { layout: "blankLayout",receiveOTPEmail:user.email,expireTime:remainTime,response:"Mã OTP không hợp lệ" });
            }
            else
            {
              return res.render("verifyTransfer", { layout: "blankLayout",receiveOTPEmail:user.email,expireTime:0,response:"Mã OTP đã hết hạn" });
            }
          }
          else
          {
            return res.redirect("/transfer")
          }
    
        }
    } catch (error) {
      console.log(error)
      return res.redirect("/logout")
    }
    
  },

  postBuyPhoneCard: async(req,res) => {

    try {

      if (!req.session.isLogin) {
        return res.redirect("/login");
        }
      else
      {
        const accessToken = req.cookies.accessToken;
        const verifyToken = jwt.verify(accessToken, process.env.JWT_ACCESS_KEY);
        let user = await User.findOne({ username: verifyToken.data.username });
        let userAccount = await Account.findOne({username: user.username})
        let error = {
          isError: false,
          errorMessage: "",
        };
       
        if(!req.body.network)
        {
          error.isError = true;
          error.errorMessage = "Vui lòng chọn nhà mạng";
          return backToInputForm("buyphonecard", user, res, error, {},req);
        }
        if(!req.body.denominations )
        {
          error.isError = true;
          error.errorMessage = "Vui lòng chọn mệnh giá";
          return backToInputForm("buyphonecard", user, res, error, {},req);
        }
        if(!req.body.network  || !req.body.amount  || !req.body.denominations || req.body.amount > 5||req.body.amount < 1 )
        {
          error.isError = true;
          error.errorMessage = "Dữ liệu truyền vào không hợp lệ";
          return backToInputForm("buyphonecard", user, res, error, {},req);
        }

          let cardList = [];
          for(let i = 1 ; i <= req.body.amount; i++)
          {
            let card = req.body.network;
            for(let j = 1 ; j <= 5 ; j++) // random card character
            {
              card += Math.floor(Math.random()*9)
            }
            cardList.push(card)
          }
          let cardType = '';
          if(req.body.network == '11111')
          {
            cardType = "Viettel " +toMoney(req.body.denominations,"đ")+": "; 
          }
          else if (req.body.network =='22222')
          {
            cardType = "Mobifone" +toMoney(req.body.denominations,"đ")+": "; 
          }
          else
          {
            cardType = "Vinaphone" +toMoney(req.body.denominations,"đ")+": "; 
          }
          let describe = ''
          cardList.forEach((data) => {
            describe += cardType + data+"<br>"
          })

          let total = parseInt(req.body.denominations) * parseInt(req.body.amount)
          await Transaction.create({
            userID: user.username,
            transactionType:"Buy",
            transactionDate: generateLocalDate(),
            transactionAmount: total,
            status: "Success",
            describe: describe,
          })
          await userAccount.updateOne({$inc: { balance: (total * -1)}})
          return res.redirect("/transaction");
      }  

    } catch (error) {
      console.log(error)
      return res.redirect("/logout")
    }


  },

  searchTransaction:  async(req, res) => {
    try {
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
                    .toLocaleString("en-GB",{ timeZone: "UTC" })
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
    } catch (error) {
        console.log(error)
        return res.redirect("/transaction")
    }
    
  },

  viewTransactionDetail: async(req,res) => {
    try {
      let user = await User.findOne({ username: req.session.username }).lean();
      Transaction.findOne({ _id: new ObjectId(req.body.inputTransactionID) })
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
            } else if(result.status.toLowerCase() === "fail") {
              result.status = "Thất bại";
            }
            else{result.status = "Thành công";}

            let detailView ="";
            if(result.transactionType.toLowerCase() === "deposit")
            {
              detailView ="userDeposit";
              result.transactionType ="Nạp tiền"
            }else if(result.transactionType.toLowerCase() === "withdraw")
            { detailView = "userWithdraw";
              result.transactionType ="Rút tiền"}
            else if(result.transactionType.toLowerCase() === "transfer")
            {
              detailView = "userTransfer" 
              result.transactionType ="Chuyển tiền"}
            else if(result.transactionType.toLowerCase() === "buy")
            {
              detailView = "userBuy"
              result.transactionType ="Mua thẻ"}
            else{
              detailView = "userReceive"
              result.transactionType ="Nhận tiền"}

            return res.render("./userTransactionDetail/"+detailView, {
              layout: "main",
              user,
              accountStatus: req.session.accountStatus,
              TransactionData: result,
            });
          } else {
            return res.redirect("/transaction");
          }
        });
    } catch (error) {
      console.log(error);
      return res.redirect("/transaction");
    }

  }


};

function generateSearchTransactionFilter(req) {
  let filter = {};
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