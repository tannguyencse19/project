import logo from './logo.svg';
import React from 'react';
import './App.css';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import config from './config.json'
import Paho from "paho-mqtt"
import axios from "axios"
import LED_ON from './pic/led_on.png'
import LED_OFF from './pic/led_off.png'
import DOOR_OPEN from './pic/door_open.png'
import DOOR_CLOSE from './pic/door_close.png'
import { Scrollbars } from 'react-custom-scrollbars';

function App() {
  const [gas, setGas] = React.useState()
  const [humi, setHumi] = React.useState()
  const [temp, setTemp] = React.useState()
  const [led_on_1, set_ledon_1] = React.useState(false)
  const [led_on_2, set_ledon_2] = React.useState(false)
  const [led_on_3, set_ledon_3] = React.useState(false)
  const [led_on_4, set_ledon_4] = React.useState(false)
  const [door_open_1, set_dooropen_1] = React.useState(false)
  const [door_open_2, set_dooropen_2] = React.useState(false)
  const [door_open_3, set_dooropen_3] = React.useState(false)

  React.useEffect(() => {
    axios
      .get(
        `https://io.adafruit.com/api/v2/${config.USER_NAME}/feeds/${config.FEED_GAS_KEY}/data?limit=10`,
        {
          headers: {
            "x-aio-key": config.ADAFRUIT_KEY,
          },
        }
      )
      .then((res) => {
        if (res.data) {

          const points = res.data.map(
            (temp) => {
              const date = new Date(temp.created_at)
              return {
                name: `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
                value: temp.value
              }
            })
          console.log(res.data)
          setGas(points.reverse())

        }
      })

    axios
      .get(
        `https://io.adafruit.com/api/v2/${config.USER_NAME}/feeds/${config.FEED_HUMI_KEY}/data?limit=10`,
        {
          headers: {
            "x-aio-key": config.ADAFRUIT_KEY,
          },
        }
      )
      .then((res) => {
        if (res.data) {

          const points = res.data.map(
            (temp) => {
              const date = new Date(temp.created_at)
              return {
                name: `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
                value: temp.value
              }
            })
          console.log(res.data)
          setHumi(points.reverse())

        }
      })

    axios
      .get(
        `https://io.adafruit.com/api/v2/${config.USER_NAME}/feeds/${config.FEED_TEMP_KEY}/data?limit=10`,
        {
          headers: {
            "x-aio-key": config.ADAFRUIT_KEY,
          },
        }
      )
      .then((res) => {
        if (res.data) {

          const points = res.data.map(
            (temp) => {
              const date = new Date(temp.created_at)
              return {
                name: `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
                value: temp.value
              }
            })
          console.log(res.data)
          setTemp(points.reverse())

        }
      })

  }, [])


  const AIO_FEED_IDS = [config.FEED_GAS_KEY, config.FEED_HUMI_KEY, config.FEED_TEMP_KEY]

  // Create a client instance
  var client = new Paho.Client(
    "io.adafruit.com",
    Number(443),
    "abcdefgh"
  )

  // set callback handlers
  client.onConnectionLost = onConnectionLost
  client.onMessageArrived = onMessageArrived
  // connect the client
  client.connect({
    userName: config.USER_NAME,
    password: config.ADAFRUIT_KEY,
    onSuccess: onConnect,
    useSSL: true,
  })

  // called when the client connects
  function onConnect() {
    // Once a connection has been made, make a subscription and send a message.
    console.log("onConnect")
    AIO_FEED_IDS.forEach((id) => {
      client.subscribe(`${config.USER_NAME}/feeds/` + id, { onSuccess: onSubscribe })
    })
  }

  function onSubscribe() {
    console.log("Subscribe success!")
  }

  // called when the client loses its connection
  function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
      console.log("onConnectionLost:" + responseObject.errorMessage)
    }
  }

  // called when a message arrives
  function onMessageArrived(message) {
    console.log("onMessageArrived:" + message.payloadString)
    console.log("feed: " + message.destinationName)
    if (message.destinationName === `${config.USER_NAME}/feeds/${config.FEED_GAS_KEY}`) {
      const date = new Date()
      const tempOb = {
        name: `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
        value: Number(message.payloadString)
      }
      setGas([...gas, tempOb])
    }
    else if (message.destinationName === `${config.USER_NAME}/feeds/${config.FEED_HUMI_KEY}`) {
      const date = new Date()
      const tempOb = {
        name: `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
        value: Number(message.payloadString)
      }
      setHumi([...humi, tempOb])
    }

    else if (message.destinationName === `${config.USER_NAME}/feeds/${config.FEED_TEMP_KEY}`) {
      const date = new Date()
      const tempOb = {
        name: `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
        value: Number(message.payloadString)
      }
      setTemp([...temp, tempOb])
    }
  }

  const openDoor = (door_num) => {
    var message = new Paho.Message("1");
    switch(door_num) {
      case 1:
        set_dooropen_1(true);
        message.destinationName = `${config.USER_NAME}/feeds/${config.FEED_DOOR_KEY_1}`;
        break;
      case 2:
        set_dooropen_2(true);
        message.destinationName = `${config.USER_NAME}/feeds/${config.FEED_DOOR_KEY_2}`;
        break;
      case 3:
        set_dooropen_3(true);
        message.destinationName = `${config.USER_NAME}/feeds/${config.FEED_DOOR_KEY_3}`;
        break;
    }
    client.send(message);
  }

  const closeDoor = (door_num) => {
    var message = new Paho.Message("0");
    switch(door_num) {
      case 1:
        set_dooropen_1(false);
        message.destinationName = `${config.USER_NAME}/feeds/${config.FEED_DOOR_KEY_1}`;
        break;
      case 2:
        set_dooropen_2(false);
        message.destinationName = `${config.USER_NAME}/feeds/${config.FEED_DOOR_KEY_2}`;
        break;
      case 3:
        set_dooropen_3(false);
        message.destinationName = `${config.USER_NAME}/feeds/${config.FEED_DOOR_KEY_3}`;
        break;
    }
    client.send(message);
  }

  const openLED = (led_num) => {
    var message = new Paho.Message("1");
    switch(led_num) {
      case 1:
        set_ledon_1(true);
        message.destinationName = `${config.USER_NAME}/feeds/${config.FEED_LED_KEY_1}`;
        break;
      case 2:
        set_ledon_2(true);
        message.destinationName = `${config.USER_NAME}/feeds/${config.FEED_LED_KEY_2}`;
        break;
      case 3:
        set_ledon_3(true);
        message.destinationName = `${config.USER_NAME}/feeds/${config.FEED_LED_KEY_3}`;
        break;
      case 4:
        set_ledon_4(true);
        message.destinationName = `${config.USER_NAME}/feeds/${config.FEED_LED_KEY_4}`;
        break;
    }
    client.send(message);
  }

  const closeLED = (led_num) => {
    var message = new Paho.Message("0");
    switch(led_num) {
      case 1:
        set_ledon_1(false);
        message.destinationName = `${config.USER_NAME}/feeds/${config.FEED_LED_KEY_1}`;
        break;
      case 2:
        set_ledon_2(false);
        message.destinationName = `${config.USER_NAME}/feeds/${config.FEED_LED_KEY_2}`;
        break;
      case 3:
        set_ledon_3(false);
        message.destinationName = `${config.USER_NAME}/feeds/${config.FEED_LED_KEY_3}`;
        break;
      case 4:
        set_ledon_4(false);
        message.destinationName = `${config.USER_NAME}/feeds/${config.FEED_LED_KEY_4}`;
        break;
    }
    client.send(message);
  }

  const renderLineGasChart = (
    <LineChart width={400} height={300} data={gas}>
      <Line type="monotone" dataKey="value" stroke="#8884d8" />
      <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
    </LineChart>
  );

  const renderLineHumiChart = (
    <LineChart width={400} height={300} data={humi}>
      <Line type="monotone" dataKey="value" stroke="#8884d8" />
      <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
    </LineChart>
  );

  const renderLineTempChart = (
    <LineChart width={400} height={300} data={temp}>
      <Line type="monotone" dataKey="value" stroke="#8884d8" />
      <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
    </LineChart>
  );

  return (
    <div className="App d-flex align-items-center flex-column">
      <div className='text-warning m-1'>
        <h1>DOOR</h1>
      </div>
      <Scrollbars style={{ height: "30vw" }}>
        <div className = "App d-flex justify-content-between flex-row">
          <div className='border border-3 border-warning m-5' style={{minWidth: "300px"}} >
            <div className='text-warning'>
              <h2>DOOR #1</h2>
            </div>
            {
              door_open_1?
              <img src={DOOR_OPEN}/>
              :
              <img src={DOOR_CLOSE}/>
            }
            <div className=''>
              <button className='btn btn-primary m-2' onClick={()=>openDoor(1)}>Open</button>
              <button className='btn btn-danger m-2' onClick={()=>closeDoor(1)}>Close</button>
            </div>
          </div>
          <div className='border border-3 border-warning m-5' style={{minWidth: "300px"}} >
            <div className='text-warning'>
              <h2>DOOR #2</h2>
            </div>
            {
              door_open_2?
              <img src={DOOR_OPEN}/>
              :
              <img src={DOOR_CLOSE}/>
            }
            <div className=''>
              <button className='btn btn-primary m-2' onClick={()=>openDoor(2)}>Open</button>
              <button className='btn btn-danger m-2' onClick={()=>closeDoor(2)}>Close</button>
            </div>
          </div>
          <div className='border border-3 border-warning m-5' style={{minWidth: "300px"}} >
            <div className='text-warning'>
              <h2>DOOR #3</h2>
            </div>
            {
              door_open_3?
              <img src={DOOR_OPEN}/>
              :
              <img src={DOOR_CLOSE}/>
            }
            <div className=''>
              <button className='btn btn-primary m-2' onClick={()=>openDoor(3)}>Open</button>
              <button className='btn btn-danger m-2' onClick={()=>closeDoor(3)}>Close</button>
            </div>
          </div>
        </div>
      </Scrollbars>
      
      <div className='text-success'>
        <h1>LED</h1>
      </div>
      <Scrollbars style={{ height: "30vw" }}>
        <div className = "App d-flex justify-content-between flex-row">
          <div className='border border-3 border-success m-5' style={{minWidth: "300px"}} >
            <div className='text-success'>
              <h2>LED #1</h2>
            </div>
            {
              led_on_1?
              <img src={LED_ON}/>
              :
              <img src={LED_OFF}/>
            }
            <div className=''>
              <button className='btn btn-primary m-2' onClick={()=>openLED(1)}>Open</button>
              <button className='btn btn-danger m-2' onClick={()=>closeLED(1)}>Close</button>
            </div>
          </div>
          <div className='border border-3 border-success m-5' style={{minWidth: "300px"}} >
            <div className='text-success'>
              <h2>LED #2</h2>
            </div>
            {
              led_on_2?
              <img src={LED_ON}/>
              :
              <img src={LED_OFF}/>
            }
            <div className=''>
              <button className='btn btn-primary m-2' onClick={()=>openLED(2)}>Open</button>
              <button className='btn btn-danger m-2' onClick={()=>closeLED(2)}>Close</button>
            </div>
          </div>
          <div className='border border-3 border-success m-5' style={{minWidth: "300px"}} >
            <div className='text-success'>
              <h2>LED #3</h2>
            </div>
            {
              led_on_3?
              <img src={LED_ON}/>
              :
              <img src={LED_OFF}/>
            }
            <div className=''>
              <button className='btn btn-primary m-2' onClick={()=>openLED(3)}>Open</button>
              <button className='btn btn-danger m-2' onClick={()=>closeLED(3)}>Close</button>
            </div>
          </div>
          <div className='border border-3 border-success m-5' style={{minWidth: "300px"}} >
            <div className='text-success'>
              <h2>LED #4</h2>
            </div>
            {
              led_on_4?
              <img src={LED_ON}/>
              :
              <img src={LED_OFF}/>
            }
            <div className=''>
              <button className='btn btn-primary m-2' onClick={()=>openLED(4)}>Open</button>
              <button className='btn btn-danger m-2' onClick={()=>closeLED(4)}>Close</button>
            </div>
          </div>
        </div>
      </Scrollbars>

      <div className='text-danger'>
        <h1>CHART</h1>
      </div>
      <div className = "App d-flex justify-content-between flex-row w-100">
        <div className='border border-3 border-danger m-2'>
          <div className='text-danger'>
            <h2>Gas Chart</h2>
          </div>
          <div>
            {renderLineGasChart}
          </div>
        </div>
        <div className='border border-3 border-danger m-2'>
          <div className='text-danger'>
            <h2>Humidity Chart</h2>
          </div>
          <div>
            {renderLineHumiChart}
          </div>
        </div>
        <div className='border border-3 border-danger m-2'>
          <div className='text-danger'>
            <h2>Temperature Chart</h2>
          </div>
          <div>
            {renderLineTempChart}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
