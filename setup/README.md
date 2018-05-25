# Setup

This doc covers hardware, raspberry Pi, signal K settup needed to run the sailinginstuments app. Generic setup will do. This is a 
record for my refrence.


# Physical Hardware


# Raspberry Pi

Recent Raspberry PI with OS running as setup below.
I use a Arduino Due with 2x Can Trancervers attached emiting actisense binary over a serial port, because the Pi under load seems to drop interupts from a MCP2515 which will eventually lock the chip. Also the can kernel driver does not appear 100% stable. The Arduino Due draws an extra 70mA over the Pi, but probably reduces the current draw on the Pi by the same.

This code runs on the Due. https://github.com/ttlappalainen/NMEA2000.git see the ActisenseListener example.


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

Using the admin UI add the following plugins

    "@ib236/sailinstruments": "^0.1.6",
    "@ib236/signalk-derived-data": "^1.4.112",
    "@ib236/signalk-prometheus-exporter": "0.0.1",
    "@ib236/signalk-to-influxdb": "^1.1.100",

Also add manually, if not released

    "@ieb/signalk-enviro": "github:ieb/signalk-enviro",
    "@ieb/signalk-telemetry": "github:ieb/signalk-telemetry",
    "@ieb/signalk-temperature": "github:ieb/signalk-temperature",
    "@ieb/signalk-to-nke": "github:ieb/signalk-to-nke"

Configure the packages
Configure the providers, with a Due converter plugged into the USB port it appears on /dev/ttyACM0 the device might vary.

     {
      "id": "Due Actisense",
      "pipeElements": [
        {
          "type": "providers/simple",
          "options": {
            "logging": false,
            "type": "NMEA2000",
            "subOptions": {
              "type": "ngt-1",
              "device": "/dev/ttyACM0"
            }
          }
        }
      ],
      "enabled": true
    }








## Install Prometheus

See README_prometheus.md

## Grafana install


    wget https://github.com/fg2it/grafana-on-raspberry/releases/download/v5.0.4/grafana_5.0.4_armhf.deb
    dpkg -i grafana_5.0.4_armhf.deb

runs on port 3000 default user is admin:admin

Add a datasource and create dashboards.


## Access point

Runing as an Access point with hostapd and dnsmasq.

    apt-get install hostapd dnsmasq -yqq

    cat > /etc/dnsmasq.conf <<EOF
    interface=wlan0
    dhcp-range=192.168.4.2,192.168.4.50,255.255.255.0,12h
    EOF

    cat > /etc/hostapd/hostapd.conf <<EOF
    interface=wlan0
    hw_mode=g
    channel=10
    auth_algs=1
    wpa=2
    wpa_key_mgmt=WPA-PSK
    wpa_pairwise=CCMP
    rsn_pairwise=CCMP
    wpa_passphrase=$APPASS
    ssid=$APSSID
    ieee80211n=1
    wmm_enabled=1
    ht_capab=[HT40][SHORT-GI-20][DSSS_CCK-40]
    EOF

    cat >> /etc/network/interfaces <<EOF
    # Added by rPi Access Point Setup
    allow-hotplug wlan0
    iface wlan0 inet static
        address 192.168.4.1
        netmask 255.255.255.0
        network 192.168.4.0
        broadcast 192.168.4.255
    EOF

    echo "denyinterfaces wlan0" >> /etc/dhcpcd.conf



    systemctl enable hostapd
    systemctl enable dnsmasq

    sudo service hostapd start
    sudo service dnsmasq start


    # enable forwarding, note enxb827ebfa37ba is the name of your ethernet device, which may not be eth0. ifconfig will tell you.
    # in /etc/sysctl.conf set forwarding
    # net.ipv4.ip_forward=1


    iptables --append FORWARD --in-interface wlan0  -j ACCEPT
    iptables --table nat --append POSTROUTING --out-interface enxb827ebfa37ba -j MASQUERADE


    iptables-save  > /etc/iptables.ipv4.nat 

    # in rc.local add 
    iptables-restore < /etc/iptables.ipv4.nat

