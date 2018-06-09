# Prometheus for Signalk.

It may seem like a strange choice, however Prometheus makes sense for signalK since everything SignalK woud log 
is numbers identified by a path and Prometheus perfoms pulls from a http end point.

InfluxDB is normally used. This covers setup of Prometheus

sudo su - root
cd /opt
wget https://github.com/prometheus/node_exporter/releases/download/v0.16.0/node_exporter-0.16.0.linux-armv7.tar.gz
ln -s node_exporter-0.16.0.linux-armv7 node_exporter
wget https://github.com/prometheus/prometheus/releases/download/v2.2.1/prometheus-2.2.1.linux-armv7.tar.gz
ln -s prometheus-2.2.1.linux-armv7 prometheus
useradd prometheus
chmod -R prometheus:prometheus prometheus node_exporter

cat << EOF > /opt/prometheus/prometheus.service
# /etc/systemd/system/prometheus.service
[Unit]
Description=Prometheus Server
Documentation=https://prometheus.io/docs/introduction/overview/
After=network-online.target

[Service]
User=prometheus
Restart=on-failure
ExecStart=/opt/prometheus/prometheus \
          --config.file=/opt/prometheus/prometheus.yml \
          --storage.tsdb.path=/opt/prometheus/data \
          --storage.tsdb.retention=3650d \
          --web.console.templates=/opt/prometheus/consoles \
          --web.console.libraries=/opt/prometheus/console_libraries

[Install]
WantedBy=multi-user.target
EOF


cat << EOF > /opt/node_exporter/node_exporter.service
# /etc/systemd/system/node_exporter.service
[Unit]
Description=Node Exporter

[Service]
User=prometheus
ExecStart=/opt/node_exporter/node_exporter

[Install]
WantedBy=default.target
EOF


cat << EOF > /opt/prometheus/prometheus.yml
# my global config
global:
  scrape_interval:     15s # Set the scrape interval to every 15 seconds. Default is every 1 minute.
  evaluation_interval: 15s # Evaluate rules every 15 seconds. The default is every 1 minute.
  # scrape_timeout is set to the global default (10s).

# Alertmanager configuration
alerting:
  alertmanagers:
  - static_configs:
    - targets:
      # - alertmanager:9093

# Load rules once and periodically evaluate them according to the global 'evaluation_interval'.
rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

# A scrape configuration containing exactly one endpoint to scrape:
# Here it's Prometheus itself.
scrape_configs:
  # The job name is added as a label job=job_name to any timeseries scraped from this config.
  - job_name: 'prometheus'

    # metrics_path defaults to '/metrics'
    # scheme defaults to 'http'.

    static_configs:
      - targets: ['localhost:9090']
  - job_name: 'node'

    # metrics_path defaults to '/metrics'
    # scheme defaults to 'http'.

    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'boat'

    # metrics_path defaults to '/metrics'
    # scheme defaults to 'http'.
    metrics_path: /signalk/v1/api/prometheus

    static_configs:
      - targets: ['localhost']

EOF

ln -s /opt/prometheus/prometheus.service /etc/systemd/system/prometheus.service
ln -s /opt/node_exporter/node_exporter.service /etc/systemd/system/node_exporter.service


systemctl daemon-reload
systemctl enable prometheus
systemctl start prometheus
systemctl status prometheus
systemctl enable node_exporter
systemctl start node_exporter
systemctl status node_exporter

