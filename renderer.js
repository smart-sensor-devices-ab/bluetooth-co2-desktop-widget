// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const { SerialPort } = require("serialport");
var port;
var readDataArray = [];
async function listSerialPorts() {
  await SerialPort.list().then((ports, err) => {
    if (err) {
      document.getElementById("error").textContent = err.message;
      return;
    } else {
      document.getElementById("error").textContent = "";
    }
    console.log("ports", ports);

    if (ports.length === 0) {
      document.getElementById("error").textContent = "No ports discovered";
    } else {
      ports = ports.filter((x) => x.vendorId == "2dcf");
      if (ports && ports.length > 0) {
        port = new SerialPort({
          path: ports[0].path,
          baudRate: 57600,
        });
        port.write(Buffer.from("AT+DUAL\r"), function (err) {
          if (err) {
            document.getElementById("error").textContent =
              "Error writing at dual";
          } else {
            const myWriteFunc = () => {
              port.write(Buffer.from("AT+FINDSCANDATA=5B0705=3\r")),
                function (err) {
                  if (err) {
                    document.getElementById("error").textContent =
                      "Error writing findscandata";
                  } else {
                    console.log("here");
                  }
                };
            };
            myWriteFunc();
            setInterval(() => {
              myWriteFunc();
            }, 20000);
          }
        });
        // Read serial port data
        port.on("readable", () => {
          let data = port.read();
          let enc = new TextDecoder();
          let arr = new Uint8Array(data);
          let removeRn = enc.decode(arr).replace(/\r?\n|\r/gm, "");
          if (removeRn != null) readDataArray.push(removeRn);
          if (removeRn == "SCAN COMPLETE") {
            console.log(readDataArray);
            let resp = readDataArray[readDataArray.length - 2];

            let advData = resp.split(" ").pop();
            let pos = advData.indexOf("5B0705");
            console.log("advData", advData);
            console.log("c", advData.substr(pos + 46, 4));
            let co2 = parseInt("0x" + advData.substr(pos + 46, 4));
            console.log(co2);
            document.getElementById("co2Val").innerHTML = co2;
          }
        });
      } else {
        document.getElementById("error").innerHTML =
          "No device found. Please connect a BleuIO ongle to your computer and try again.";
      }
    }
  });
}

function listPorts() {
  listSerialPorts();
  setTimeout(listPorts, 20000);
}

// Set a timeout that will check for new serialPorts every 2 seconds.
// This timeout reschedules itself.
//setTimeout(listPorts, 2000);

listSerialPorts();
