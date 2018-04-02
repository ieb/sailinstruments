# Setup

This doc covers hardware, raspberry Pi, signal K settup needed to run the sailinginstuments app. Generic setup will do. This is a 
record for my refrence.


# Physical Hardware

# Raspberry Pi

Recent Raspberry PI with OS running, setup below. Connected over a 40way ribbon cable to the daughter board with the harware blow. Some is optional. THe main aim is to read and potentially write to the NMEA2000 or CanBus. NMEA2000 is a Can Bus with standards arround the wire, connectors, and some additional messages. Electrically it is identical. Hence CAN hardware can be used.

## Setup Wifi

eg as a client, but it can also be configured as an AP.

    cat << EOF > /etc/wpa_supplicant/wpa_supplicant.conf 
    country=GB
    ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
    update_config=1
    network={
         ssid="yourSSID"
         psk="*********"
    }
    EOF



## Reconfigure.
    
    raspi-config
    # then enable ssh server
    # enable SPI, I2C, 1Wire.

## Enable the required kernel overlays  (after checking that the CAN Trancever is working properly.)

edit /boot/config.txt to make sure the following are set.

    dtparam=i2c_arm=on
    dtparam=spi=on
    dtoverlay=i2c-rtc,ds3231
    dtoverlay=w1-gpio

## Dual CAN Trancever.

I have 2x MCP2515 chips with CanBus transponders running at 5v to give clean 4.2V CanH voltages compatable with NMEA2000 signal levels. Running at 3.3v results the CanBus transponders pulling the signal levels down while transmitting. NMEA2000 devices appear
to cope with that, but its probably not a good idea, hence 5v. Being 5v the MCP2515s are interfaced via level shifters into the SDI wires (MOSI, MISO, SCLK, 2xINTS, 2xCS).

Wiring, eg. 

    LS bi-directional level shifer.
    GND, 5V, 3V Pins can be relocated.
    Pi Pin
    2 5V   --------------- Vdd
    1 3V3   ------> LS 3V3
    2 5V ---------> LS 5V
    9 GND --------> LS GND
    9 GND  ---------------  GND
    19 MOSI -----> LS ----> SI0 & SI1
    21 MOSO <----- LS <---- SO0 & SO1
    23 SCLK -----> LS ----> SCLK0 & SCLK1
    24 CE0 ------> LS ----> CS0
    26 CE1 ------> LS ----> CS1
    18 GPIO24 <--  LS <---- INT0
    22 GPIO25 <--  LS <---- INT1

## Sensors

The following sensors are all running on 3.3v using standard widing. 

    1 3V3 -> Vdd on all chips
    9 GND -> GND on all chips
    3 SDA -> SDA on all I2C chips.
    5 SCL -> SCL on all I2C chips.
    7 Data -> Data on all 1Wire chips.


BN055 is I2C providing 9DOF, read by signalk-imu plugin, which needs to be added to the signalk server.
BMP280 is temperature, pressure on I2C, read by signalk-enviro plugin, which needs to be added to the signalk server.
1Wire, currently using multiple temperature sensors DS18B20, read by signalk-temperature
ds3231, RTC on I2C


# Software setup.

## Check CAN Trancevers.

    root@raspb:~/can-utils# dtoverlay mcp2515-can0  oscillator=8000000 interrupt=24
    root@raspb:~/can-utils# dtoverlay mcp2515-can1  oscillator=8000000 interrupt=25

    root@raspb:~/can-utils# dmesg | egrep "spi|can"
    [  477.594591] mcp251x spi0.0 can0: MCP2515 successfully initialized.
    [  487.165293] mcp251x spi0.1 can1: MCP2515 successfully initialized.
    [  495.704786] can: controller area network core (rev 20120528 abi 9)
    root@raspb:~/can-utils# ifconfig can0
    can0: flags=128<NOARP>  mtu 16
            unspec 00-00-00-00-00-00-00-00-00-00-00-00-00-00-00-00  txqueuelen 10  (UNSPEC)
            RX packets 0  bytes 0 (0.0 B)
            RX errors 0  dropped 0  overruns 0  frame 0
            TX packets 0  bytes 0 (0.0 B)
            TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

    root@raspb:~/can-utils# ifconfig can1
    can1: flags=128<NOARP>  mtu 16
            unspec 00-00-00-00-00-00-00-00-00-00-00-00-00-00-00-00  txqueuelen 10  (UNSPEC)
            RX packets 0  bytes 0 (0.0 B)
            RX errors 0  dropped 0  overruns 0  frame 0
            TX packets 0  bytes 0 (0.0 B)
            TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

    root@raspb:~/can-utils# 

If you see the following, then the cause is almost certainly exactly as the log message says. If both spi0.0 and spi0.1 are failing, then its probably a bad connection, dry joint or misswire on MOSI, MISO, or SCK. If only one fails then its probably 
bad joint, misswire on the CS or INT lines for that Can driver.

    Mar 29 13:47:38 raspb kernel: [  363.975560] mcp251x spi0.1: Cannot initialize MCP2515. Wrong wiring?
    Mar 29 13:47:38 raspb kernel: [  363.975578] mcp251x spi0.1: Probe failed, err=19


### Script to bring up the Canbus devices.

    #!/bin/sh
    SPIMAX=5000000
    BITRATE=250000
    dtoverlay -r mcp2515-can0
    dtoverlay -r mcp2515-can1
    dtoverlay -l
    dtoverlay mcp2515-can0  oscillator=8000000 interrupt=24 spimaxfrequency=$SPIMAX
    sleep 1
    dtoverlay mcp2515-can1  oscillator=8000000 interrupt=25 spimaxfrequency=$SPIMAX
    sleep 1
    dtoverlay -l
    ifconfig can0
    ifconfig can1
    ip link set can1 up type can bitrate $BITRATE
    ip link set can0 up type can bitrate $BITRATE
    ifconfig can0
    ifconfig can1
    ip -d -s link  show dev can0
    ip -d -s link  show dev can1

### Testing canbus.

Install canutils from source.

    # git clone https://github.com/linux-can/can-utils.git
    # cd can-utils
    # ./autogen.sh
    # ./configure
    # make
    # sudo make install
  

Enable termination resistors and connect CanH to CanH and CanL to CanL, to perform a physical looback test.

    root@raspb:~/can-utils# ./candump can1 &
    [1]+ ./candump can1 &
    root@raspb:~/can-utils# ./cansend can0 001#1122334455667788
      can1  001   [8]  11 22 33 44 55 66 77 88
    root@raspb:~/can-utils# ./cansend can0 001#1122334455667788
      can1  001   [8]  11 22 33 44 55 66 77 88
    root@raspb:~/can-utils# ./cansend can0 001#1122334455667788
      can1  001   [8]  11 22 33 44 55 66 77 88
    root@raspb:~/can-utils#

If all of that works, there is a good chance that the CanBus interfaces will work with NMEA2000. Dont forget to remove the termination jumpers before connecting to the real network. If you are going to connect one to an engine make 100% certain that the GND is common, and dont write to the engine can bus unless you really know what you are doing, only monitor.

To echo all CAN1 traffic to CAN0, setup CAN1 to listen only, and setup CAN0 to have loopback enabled to anything reading CAN0 gets the CAN0 messages as well.


    root@raspb:~/can-utils# ip link set can0 up type can bitrate 250000 loopback on
    root@raspb:~/can-utils#  ip link set can1 up type can bitrate 250000 listen-only on

Then to bridge

    candump can1 -B can0

For can0 -> SK

see https://github.com/chacal/signalk-socketcan-device


# Configure Can trancerver for reboot

## Enable the required kernel overlays  

dtoverlay=mcp2515-can0,oscillator=8000000,interrupt=24,spimaxfrequency=5000000
dtoverlay=mcp2515-can1,oscillator=8000000,interrupt=25,spimaxfrequency=5000000

Need to make the interfaces come up correctly on boot.

    cat << EOF > /etc/network/interfaces.d/can 
    auto can0 can1

    iface can0 can static
        bitrate 250000
       
    iface can1 can static
        bitrate 250000
    EOF

Or manually.

    ip link set can1 up type can bitrate 250000
    ip link set can0 up type can bitrate 250000

Set the queue size ? 


### CanBus wiring

I am using custom IP68 connectors for my NMEA2000 bus. They are rated to 12A on all pins and are cheap, off ebay. This is a note of the wiring.  Using standard NMEA2000/CAN Cable from Actisense. Written down here, since once the plugs are built and sealed its impossible to see which pin is connected to which color wire if there is a plug on both ends.

    Plug Wires
    Pin 1 red +
    Pin 2 black -
    Pin 3 Blue CanL
    Pin 4 White CanH
    Pin 5 drain bare wire.

For testing on the bench, I have found Cat5 or 6 wire works perfectly Ok over short distances.

    Alternate Cat6
    1 orange
    2 green
    3 Blue
    4 White/Blue


## Check I2C devices

    root@raspb:~# i2cdetect -y 1
         0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f
    00:          -- -- -- -- -- -- -- -- -- -- -- -- -- 
    10: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
    20: -- -- -- -- -- -- -- -- 28 -- -- -- -- -- -- -- 
    30: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
    40: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
    50: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
    60: -- -- -- -- -- -- -- -- UU -- -- -- -- -- -- -- 
    70: -- -- -- -- -- -- 76 --   

    28 is the BNO055
    UU is the ds3231
    76 is the BMP280


## Configure the hardware clock.

see http://raspmer.blogspot.co.uk/2015/07/how-to-use-ds3231-i2c-real-time-clock.html


# Install SignalK

Main reason for being here.

## install signalK requirements all as root

    apt-get update
    apt-get install -y curl git build-essential libnss-mdns avahi-utils libavahi-compat-libdnssd-dev
    wget https://nodejs.org/dist/v8.9.4/node-v8.9.4-linux-armv6l.tar.gz 
    tar xvzf node-v8.9.4-linux-armv6l.tar.gz  
    rm node-v8.9.4-linux-armv6l.tar.gz 
    cd /usr/local/bin/
    ln -s /opt/node-v8.9.4-linux-armv6l/bin/* .


## Install SignalK

As a normal user who is a member of the staff group


    sudo npm install -g --unsafe-perm signalk-server

This will take some time and it will leave the signalk-server installed in $nodejs/lib/node_modules/signalk-server. To create a localconfigurtion use 

    sudo signalk-server-setup

Which will setup systemd and ~/.signalk/*, these files need modifying.


    cat << EOF > settings.json
    {
      "interfaces": {
        "admin-ui": true,
        "appstore": true,
        "nmea-tcp": true,
        "plugins": true,
        "providers": true,
        "rest": true,
        "tcp": true,
        "webapps": true,
        "ws": true
      },
      "ssl": false,
      "pipedProviders": [
        {
          "id": "NMEA2000",
          "pipeElements": [
            {
              "type": "providers/simple",
              "options": {
                "logging": false,
                "type": "NMEA2000",
                "subOptions": {
                  "type": "canbus",
                  "interface": "can0"
                }
              }
            }
          ],
          "enabled": true
        },
        {
          "id": "Engine",
          "pipeElements": [
            {
              "type": "providers/simple",
              "options": {
                "logging": false,
                "type": "NMEA2000",
                "subOptions": {
                  "type": "canbus",
                  "interface": "can1"
                }
              }
            }
          ],
          "enabled": true
        }
      ],
      "disablesecurity": {
        "strategy": "@signalk/sk-simple-token-security"
      },
      "mdns": false,
      "enablePluginLogging": true,
      "port": 3000,
      "sslport": 3443,
      "loggingDirectory": "/home/ieb/logs"
    }
    EOF


    cat << EOF > package.json
    {
      "name": "signalk-server-config",
      "version": "0.0.1",
      "description": "This file is here to track your plugin and webapp installs.",
      "repository": {},
      "license": "Apache-2.0",
      "dependencies": {
        "@ieb/signalk-derived-data": "github:ieb/signalk-derived-data#withPolars",
        "@ieb/signalk-enviro": "github:ieb/signalk-enviro",
        "@ieb/signalk-imu": "github:ieb/signalk-imu",
        "@ieb/signalk-telemetry": "github:ieb/signalk-telemetry",
        "@ieb/signalk-temperature": "github:ieb/signalk-temperature",
        "@ieb/signalk-to-nke": "github:ieb/signalk-to-nke",
      }
    }
    EOF