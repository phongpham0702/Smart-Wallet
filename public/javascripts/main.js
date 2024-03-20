// Start Login JS
const contentHolder = document.getElementById("content-holder");
$(document).ready(function () {
  let animating = false,
    submitPhase1 = 1500,
    submitPhase2 = 400,
    $login = $(".login");

  function ripple(elem, e) {
    $(".ripple").remove();
    let elTop = elem.offset().top,
      elLeft = elem.offset().left,
      x = e.pageX - elLeft,
      y = e.pageY - elTop;
    let $ripple = $("<div class='ripple'></div>");
    $ripple.css({ top: y, left: x });
    elem.append($ripple);
  }

  $(document).on("click", ".login__submit", function (e) {
    e.preventDefault();
    const loginForm = document.getElementById("login__form");
    if (animating) return;

    animating = true;

    let that = this;

    ripple($(that), e);

    $(that).addClass("processing");

    setTimeout(function () {
      $(that).addClass("success");

      setTimeout(function () {
        $login.hide();
        $login.addClass("inactive");
        animating = false;
        $(that).removeClass("success processing");
        loginForm.submit();
      }, submitPhase2);
    }, submitPhase1);
  });

  

});

// End Login JS

//Start window load control

window.onload = () => {
  if (window.location.pathname === "/") {
    createUserChart();
  }
  if (window.location.pathname === "/users/recover") {
    timer();
  }
  if(window.location.pathname === "/transfer" && body.classList.contains("default-body"))
  {
    timer()
  }
  if(window.location.pathname === "/verifyTransfer" && body.classList.contains("default-body"))
  {
    timer()
  }
};

//End window load control

//Start Side Nav Control (! Do not fix anything !)
const body = document.body;
const sideNav = document.getElementsByClassName("side-nav-bar")[0];
const mainSection = document.getElementsByClassName("main")[0];
const text_content = document.querySelectorAll(".side-nav-text");
const header = document.getElementById("nav-bar-header");
const logoName = document.getElementById("logo-Name");
const hamburger = document.getElementsByClassName("hamburger")[0];

function SideNavControl(button) {
  if (body.clientWidth >= 1024) {
    //remove below 1024px screen property
    sideNav.classList.remove("side-nav-bar-expand");
    logoName.classList.remove("show-logo");
    button.classList.remove("unchange");

    logoName.classList.toggle("hide-logo");
    text_content.forEach((div) => {
      div.parentElement.classList.remove("menu-item-show");
      div.parentElement.classList.toggle("menu-item-hide");
    });
    //add new property
    sideNav.classList.toggle("side-nav-bar-minimize");
    mainSection.classList.toggle("content-minimize");
    button.classList.toggle("change");
  } else {
    //remove on 1024px screen property
    sideNav.classList.remove("side-nav-bar-minimize");
    mainSection.classList.remove("content-minimize");
    logoName.classList.remove("hide-logo");
    button.classList.remove("change");

    logoName.classList.toggle("show-logo");
    text_content.forEach((div) => {
      div.parentElement.classList.remove("menu-item-hide");
      div.parentElement.classList.toggle("menu-item-show");
    });

    //add new property
    sideNav.classList.toggle("side-nav-bar-expand");
    window_wrapper.classList.toggle("wrapper-active");
    button.classList.toggle("unchange");
  }
}

// End Side Nav Control (! Do not fix anything !)

// Start Notification Dropdown JS
const notificationMenu = document.querySelector(".notification-dropdown");

function showNotification() {
  notificationMenu.classList.toggle("show");
}

// End Notification Dropdown JS

// Start User Option Dropdown

const userOption = document.querySelector(".userOption");

function showUserOption() {
  userOption.classList.toggle("show");
}
// End User Option Dropdown

// Hide all dropdown when click anywhere on window
const window_wrapper = document.getElementById("window-wrapper");
window.onclick = (event) => {
  if (
    !event.target.matches(".bell-wrap") &&
    !event.target.matches(".notification-dropdown") &&
    !event.target.matches(".notification-box") &&
    !event.target.matches(".view-all-notification")
  ) {
    if (document.querySelector(".show") != null) {
      notificationMenu.classList.remove("show");
    }
  }
  if (
    !event.target.matches(".profile-wrap") &&
    !event.target.matches(".userOption")
  ) {
    if (document.querySelector(".show") != null) {
      userOption.classList.remove("show");
    }
  }
  if (body.clientWidth <= 1024) {
    if (
      !event.target.matches(".side-nav-bar") &&
      !event.target.matches(".hamburger") &&
      !event.target.matches(".bar1") &&
      !event.target.matches(".bar2") &&
      !event.target.matches(".bar3")
    ) {
      if (document.querySelector(".side-nav-bar-expand") != null) {
        sideNav.classList.remove("side-nav-bar-expand");
      }
      if (document.querySelector(".wrapper-active") != null) {
        window_wrapper.classList.remove("wrapper-active");
      }
      text_content.forEach((div) => {
        div.parentElement.classList.remove("menu-item-show");
      });
      if (document.querySelector(".unchange") != null) {
        hamburger.classList.remove("unchange");
      }
      if (document.querySelector(".show-logo") != null) {
        logoName.classList.remove("show-logo");
      }
    }
  }
};

window.addEventListener("resize", () => {
  if (body.clientWidth > 1024) {
    if (document.querySelector(".side-nav-bar-expand") != null) {
      sideNav.classList.remove("side-nav-bar-expand");
    }
    if (document.querySelector(".unchange") != null) {
      hamburger.classList.remove("unchange");
    }

    if (document.querySelector(".hide-logo") != null) {
      logoName.classList.remove("hide-logo");
    }
    text_content.forEach((div) => {
      if (document.querySelector(".menu-item-show") != null) {
        div.parentElement.classList.remove("menu-item-show");
      }
    });
  }
});

//Start User Chart JS

function createUserChart() {
  const userChart = document.getElementById("userMonthlyFluctuations");
  const monthlyBalanceFluctuationsChart = new Chart(userChart, {
    type: "bar",
    data: {
      labels: ["Black", "Blue", "Yellow", "Green", "Purple", "Orange"],
      datasets: [
        {
          label: "# of Votes",
          data: [10, 20, 30, 40, 50, 60],
          backgroundColor: [
            "rgba(255, 99, 132, 0.2)",
            "rgba(54, 162, 235, 0.2)",
            "rgba(255, 206, 86, 0.2)",
            "rgba(75, 192, 192, 0.2)",
            "rgba(153, 102, 255, 0.2)",
            "rgba(255, 159, 64, 0.2)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
          ],

          borderWidth: 1,
          barThickness: 30,
        },
      ],
    },
    options: {
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Monthly Balance Fluctuations",
        },
      },

      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

//End User Chart JS

// -------------------------------------------------------------
// Register page

const allInputRegister = document.querySelectorAll("#register input");
const allErrorSpan = document.querySelectorAll("#register span");
allInputRegister.forEach((inp, index) => {
  inp.addEventListener("focus", () => {
    allErrorSpan[index].innerHTML = "";
  });
});

const multiStepForm = document.querySelector("[data-multi-step]");
const formSteps = [...multiStepForm.querySelectorAll("[data-step]")];
let currentStep = formSteps.findIndex((step) => {
  return step.classList.contains("active");
});

const showCurrentStep = () => {
  formSteps.forEach((step, index) => {
    step.classList.toggle("active", index === currentStep);
  });
};

if (currentStep < 0) {
  currentStep = 0;
  showCurrentStep();
}

multiStepForm.addEventListener("click", (e) => {
  let incrementor;
  if (e.target.matches("[data-next]")) {
    incrementor = 1;
  } else if (e.target.matches("[data-previous]")) {
    currentStep--;
    showCurrentStep();
  }
  if (incrementor == null) return;

  const inputs = [...formSteps[currentStep].querySelectorAll("#form-1 input")];

  let countValid = 0;
  inputs.forEach((inp, index) => {
    if (inp.value === "") {
      allValid = false;
      allErrorSpan[index].innerText = "Vui lòng điền đẩy đủ thông tin";
    } else {
      countValid++;
    }
  });

  if (countValid === 5) {
    currentStep += incrementor;
    showCurrentStep();
  }
});

formSteps.forEach((step) => {
  step.addEventListener("animationend", (e) => {
    formSteps[currentStep].classList.remove("hide");
    e.target.classList.toggle("hide", !e.target.classList.contains("active"));
  });
});

const fontIdImage = document.getElementsByName("fontIdImage")[0];
const backIdImage = document.getElementsByName("backIdImage")[0];
const submitBtn = document.querySelector("#register .submit-btn");
const form = document.querySelector("#register form");

const fontIdImageError =
  document.getElementsByClassName("fontIdImage-error")[0];
const backIdImageError =
  document.getElementsByClassName("backIdImage-error")[0];

function registerSubmit() {
  if (fontIdImage.value === "") {
    fontIdImageError.innerHTML = "Please enter your font id image.";
  } else if (backIdImage.value === "") {
    backIdImageError.innerHTML = "Please enter your back id image.";
  } else {
    form.submit();
  }
}

function loadAvatar(event) {
  let image = document.getElementById("avatar");
  image.src = URL.createObjectURL(event.target.files[0]);
}
const loadFrontIDImage = function (event) {
  let image = document.getElementById("FrontIdDIsplay");
  image.src = URL.createObjectURL(event.target.files[0]);
};

const loadBackIDImage = function (event) {
  let image = document.getElementById("BackIdDisplay");
  image.src = URL.createObjectURL(event.target.files[0]);
};
// -------------------------------------------------------------
// Register page
/*-------------------------------------------------- Enter Code JS ----------------------------------------------------- */

function focusOTP(e, previous, curr, next) {
  e.preventDefault();
  let only1num = /[0-9]/;
  let previousOTP = document.getElementById(previous);
  let currentOTP = document.getElementById(curr);
  let nextOTP = document.getElementById(next);

  if (only1num.test(e.key)) {
    currentOTP.value = e.key;
    if (next !== "") {
      nextOTP.removeAttribute("disabled");
      nextOTP.focus();
      currentOTP.setAttribute("disabled", "");
    }
  } else if (e.key === "Backspace") {
    if (currentOTP.value !== "") {
      currentOTP.value = "";
    } else if (previous !== "") {
      previousOTP.removeAttribute("disabled");
      previousOTP.focus();
      currentOTP.setAttribute("disabled", "");
    }
  }
}

function check_and_submit(e) {
  let get_otp6 = e.target;

  if (e.key !== "Backspace" && get_otp6.value !== "" && e.key !== "Space") {
    get_otp6.setAttribute("disabled", "");
    let otp = document.querySelectorAll(".code input");
    let fullOTPInput = document.getElementById("fullOTP");
    let fullotp = "";
    let form = document.querySelector(".OTP_Form");
    for (otpvalue of otp) {
      fullotp += otpvalue.value;
    }
    fullOTPInput.setAttribute("value", fullotp);
    form.submit();
  } else {
    focusOTP(e, "otp5", "otp6", "");
  }
}

function timer() {
  let get_otp1 = document.querySelector(".code .code-item #otp1").focus();
  let danger_alert = document.querySelector(".alert-box .alert-danger");
  let countdown_box = document.querySelector(
    ".OTP_Form .countdown-box .timer .time"
  );
  let deadline = parseInt(countdown_box.dataset.time);
  let otp = document.querySelectorAll(".code input");
  let other_alert = document.getElementById("otpRespone1")
  if(deadline <= 0 )
  {
    for (otp_input of otp) {
      otp_input.setAttribute("disabled", "");
    }
    danger_alert.innerHTML =
      "Mã OTP đã hết hạn.<br>Vui lòng chọn nút gửi lại.";
    other_alert.style.display = "none"
    danger_alert.style.display = "block";
    return 0;
  }
  let set_countdown = setInterval(() => {
    deadline -= 1000;
    let second = Math.floor(deadline / 1000);
    let minute = Math.floor(second / 60);

    if (second < 10) {
      countdown_box.innerHTML = minute + ":0" + second;
    } else {
      countdown_box.innerHTML = minute + ":" + second;
    }

    if (deadline <= 0) {
      clearInterval(set_countdown);
      for (otp_input of otp) {
        otp_input.setAttribute("disabled", "");
      }
      danger_alert.innerHTML =
        "Mã OTP đã hết hạn.";
      other_alert.style.display = "none"
      danger_alert.style.display = "block";
    }
  }, 1000);
}

/*-------------------------------------------------- Enter Code JS ----------------------------------------------------- */

/*-------------------------------------------------- Pending view JS ----------------------------------------------------- */

function toMoney(moneyamount, style = "VND") {
  return (
    parseFloat(moneyamount).toLocaleString("en-US", {
      maximumFractionDigits: 2,
    }) +
    " " +
    style
  );
}

function setAmountValue(amount) {
  let amountDisplay = document.getElementById("amountDisplay");
  let value = amount.value;
  let displayValue = "";
  if (value <= 5) {
    displayValue = "Mọi số tiền";
    amountDisplay.innerText = displayValue;
  } else {
    amountDisplay.innerText = `Trên ${toMoney(value * 1000000)}`;
  }
}

function searchPendingUser() {
  let searchForm = new FormData(document.getElementById("searchPendingData"));
  let data = Object.fromEntries(searchForm);
  let url = "/admin/pending";
  let firstItem = 0;
  let tableTbody = document.querySelector("#admin #pending .table #userData");
  let tableNotification = document.querySelector(
    "#admin #pending .tableNotification"
  );

  tableTbody.innerHTML = "";
  tableNotification.innerHTML = `<div class="spinner-border" role="status" style="color:#000"></div>`;
  tableNotification.classList.add("InLoading");
  for (item in data) {
    if (data[item] !== "") {
      if (firstItem === 0) {
        url += `?${item}=${data[item]}`;
        firstItem = 1;
      } else {
        url += `&${item}=${data[item]}`;
      }
    }
  }
  if (firstItem != 0) {
    url += "&search=true";
    fetch(url, { method: "POST" })
      .then((result) => {
        return result.json();
      })
      .then((JSONResult) => {
        tableNotification.classList.remove("InLoading");
        let html = ``;
        if (JSONResult.dataFound && JSONResult.dataFound >= 1) {
          JSONResult.result.forEach((row) => {
            html += `<tr onclick="window.location.href ='/admin/userDetail/${row.username}';">
                        <td>${row.username}</td>
                        <td>${row.fullName}</td>
                        <td>${row.address}</td>
                        <td>${row.phoneNumber}</td>
                        <td>${row.email}</td>
                        <td>${row.createAt}</td>
                  
                      </tr>`;
          });
          tableNotification.innerHTML = "";
          tableTbody.innerHTML = html;
        } else {
          html = `<div style="color:#000; padding-top: 0.5rem;">${JSONResult.msg}</div>`;
          tableNotification.innerHTML = html;
        }
        history.replaceState("", "", url);
      });
  }
}


function searchActivatedUser() {
  let searchForm = new FormData(document.getElementById("searchPendingData"));
  let data = Object.fromEntries(searchForm);
  let url = "/admin/activated";
  let firstItem = 0;
  let tableTbody = document.querySelector("#admin #pending .table #userData");
  let tableNotification = document.querySelector(
    "#admin #pending .tableNotification"
  );

  tableTbody.innerHTML = "";
  tableNotification.innerHTML = `<div class="spinner-border" role="status" style="color:#000"></div>`;
  tableNotification.classList.add("InLoading");
  for (item in data) {
    if (data[item] !== "") {
      if (firstItem === 0) {
        url += `?${item}=${data[item]}`;
        firstItem = 1;
      } else {
        url += `&${item}=${data[item]}`;
      }
    }
  }
  if (firstItem != 0) {
    url += "&search=true";
    fetch(url, { method: "POST" })
      .then((result) => {
        return result.json();
      })
      .then((JSONResult) => {
        tableNotification.classList.remove("InLoading");
        let html = ``;
        if (JSONResult.dataFound && JSONResult.dataFound >= 1) {
          JSONResult.result.forEach((row) => {
            html += `<tr onclick="window.location.href ='/admin/userDetail/${row.username}';">
                        <td>${row.username}</td>
                        <td>${row.fullName}</td>
                        <td>${row.address}</td>
                        <td>${row.phoneNumber}</td>
                        <td>${row.email}</td>
                        <td>${row.createAt}</td>
                  
                      </tr>`;
          });
          tableNotification.innerHTML = "";
          tableTbody.innerHTML = html;
        } else {
          html = `<div style="color:#000; padding-top: 0.5rem;">${JSONResult.msg}</div>`;
          tableNotification.innerHTML = html;
        }
        history.replaceState("", "", url);
      });
  }
}


function searchPendingTransaction() {
  let searchForm = new FormData(document.getElementById("searchPendingData"));
  let data = Object.fromEntries(searchForm);
  let url = "/admin/transactionApproval/withdraw";
  let firstItem = 0;
  let tableTbody = document.querySelector(
    "#admin #pending .table #transactionData"
  );
  let tableNotification = document.querySelector(
    "#admin #pending .tableNotification"
  );

  tableTbody.innerHTML = "";
  tableNotification.innerHTML = `<div class="spinner-border" role="status" style="color:#000"></div>`;
  tableNotification.classList.add("InLoading");

  for (item in data) {
    if (data[item] !== "") {
      if (firstItem === 0) {
        url += `?${item}=${data[item]}`;
        firstItem = 1;
      } else {
        url += `&${item}=${data[item]}`;
      }
    }
  }
  if (firstItem != 0) {
    url += "&search=true";
    fetch(url, { method: "POST" })
      .then((result) => {
        return result.json();
      })
      .then((JSONResult) => {
        tableNotification.classList.remove("InLoading");
        let html = ``;
        if (JSONResult.dataFound && JSONResult.dataFound >= 1) {
          JSONResult.result.forEach((row) => {
            html += `<tr>
                        <td>${row._id}</td>
                        <td>${row.userID}</td>
                        <td>${row.transactionDate}</td>
                        <td>${row.transactionAmount}</td>
                        <td>${row.status}</td>
                      </tr>
                      `;
          });
          tableNotification.innerHTML = "";
          tableTbody.innerHTML = html;
        } else {
          html = `<div style="color:#000; padding-top: 0.5rem;">${JSONResult.msg}</div>`;
          tableNotification.innerHTML = html;
        }
        history.replaceState("", "", url);
      });
  }
}


function userSearchPendingTransaction() {
  let searchForm = new FormData(document.getElementById("searchPendingData"));
  let data = Object.fromEntries(searchForm);
  let url = "/transaction";
  let firstItem = 0;
  let tableTbody = document.querySelector(
    "#admin #pending .table #transactionData"
  );
  let tableNotification = document.querySelector(
    "#admin #pending .tableNotification"
  );

  tableTbody.innerHTML = "";
  tableNotification.innerHTML = `<div class="spinner-border" role="status" style="color:#000"></div>`;
  tableNotification.classList.add("InLoading");

  for (item in data) {
    if (data[item] !== "") {
      if (firstItem === 0) {
        url += `?${item}=${data[item]}`;
        firstItem = 1;
      } else {
        url += `&${item}=${data[item]}`;
      }
    }
  }
  if (firstItem != 0) {
    url += "&search=true";
    fetch(url, { method: "POST" })
      .then((result) => {
        return result.json();
      })
      .then((JSONResult) => {
        tableNotification.classList.remove("InLoading");
        let html = ``;
        if (JSONResult.dataFound && JSONResult.dataFound >= 1) {
          JSONResult.result.forEach((row) => {

            if (row.status.toLowerCase() === "pending") {
              row.status = "Chờ duyệt";
            } else if(row.status.toLowerCase() === "fail") {
              row.status = "Thất bại";
            }
            else{row.status = "Thành công";}

            if(row.transactionType.toLowerCase() === "deposit")
            {
              row.transactionType ="Nạp tiền"
            }else if(row.transactionType.toLowerCase() === "withdraw")
            {row.transactionType ="Rút tiền"}
            else if(row.transactionType.toLowerCase() === "transfer")
            {row.transactionType ="Chuyển tiền"}
            else if(row.transactionType.toLowerCase() === "buy")
            {row.transactionType ="Mua thẻ"}
            else{row.transactionType ="Nhận tiền"}

            html += `<tr>
                        <td>${row._id}</td>
                        <td>${row.transactionType}</td>
                        <td>${row.transactionDate}</td>
                        <td>${row.transactionAmount}</td>
                        <td>${row.status}</td>
                      </tr>
                      `;
          });
          tableNotification.innerHTML = "";
          tableTbody.innerHTML = html;
        } else {
          html = `<div style="color:#000; padding-top: 0.5rem;">${JSONResult.msg}</div>`;
          tableNotification.innerHTML = html;
        }
        history.replaceState("", "", url);
      });
  }
}



function withdrawFee (amount)
  {
    let displayFee = document.getElementById("withdrawFeeValue")
    if(amount >= 50000)
    {
      
      displayFee.innerText = "*Phí rút tiền là: "+ toMoney ((amount * 5)/100)
    }
    else
    {
      displayFee.innerText = ""
    }
  }

function getUserNameThroughtPhoneNum(phoneNumber)
{
  let receiverNameInput = document.getElementsByName("receiverName")[0]
  if(phoneNumber.length === 10 )
  {
    fetch("/getUserNameByPhoneNumber",{
        method:"POST",
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({phoneNumber:phoneNumber})})
    .then((result) => {return result.json();})
    .then((JSONResult) => {

        if(JSONResult.receiverName)
        {
          receiverNameInput.value = JSONResult.receiverName
          receiverNameInput.parentElement.style.display = "block"
        }
        else
        {
          receiverNameInput.value = ""
          receiverNameInput.parentElement.style.display = "none"
        }
    })
  }
  else
  {
    receiverNameInput.value = ""
    receiverNameInput.parentElement.style.display = "none"
  }
}

function getTransactionID(id)
{
  let sendForm = document.getElementById("findTransactionDetail")
  let inputID = document.getElementById("inputTransactionID")
  inputID.value = id
  sendForm.submit();
}



function networkClickEffect(tag) { 
    let network = document.querySelectorAll(".network label") 
    network.forEach((button) => {
    button.classList.remove("onChooseEffect") })
    tag.classList.add("onChooseEffect") 
} 
function denominationsClickEffect(tag)
{     let cardValue =document.querySelectorAll(".denominations label") 
      cardValue.forEach((button) => { button.classList.remove("onChooseEffect")}) 
      tag.classList.add("onChooseEffect") 
}