# Function to check if a command exists in PATH
function command_exists() {
  command -v "$1" >/dev/null 2>&1
}

function generateOrgs() {
    rm -rf organizations

    echo "Generating crypto material for Org1"
    cryptogen generate --config=compose/crypto-config-org1.yaml --output="organizations"
    if [ $? -ne 0 ]; then
      echo "Failed to generate certificate for org1"
      exit 1
    fi

    echo "Generating crypto material for Orderer"
    cryptogen generate --config=compose/crypto-config-orderer.yaml --output="organizations"
    if [ $? -ne 0 ]; then
      echo "Failed to generate certificate for org1"
      exit 1
    fi

    echo "Successfully generated all Org material"
}

function createChannel() {
    CHANNEL_NAME="$1"
}

function setGeneralVars() {
    export CORE_PEER_TLS_ENABLED=true
    export ORDERER_CA=${PWD}/organizations/ordererOrganizations/fabrictest.com/tlsca/tlsca.fabrictest.com-cert.pem
    export PEER0_ORG1_CA=${PWD}/organizations/peerOrganizations/org1.fabrictest.com/tlsca/tlsca.org1.fabrictest.com-cert.pem
    export ORDERER_ADMIN_TLS_SIGN_CERT=${PWD}/organizations/ordererOrganizations/fabrictest.com/orderers/orderer.fabrictest.com/tls/server.crt
    export ORDERER_ADMIN_TLS_PRIVATE_KEY=${PWD}/organizations/ordererOrganizations/fabrictest.com/orderers/orderer.fabrictest.com/tls/server.key
}

function setOrg1Vars() {
    export CORE_PEER_LOCALMSPID="Org1MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG1_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.fabrictest.com/users/Admin@org1.fabrictest.com/msp
    export CORE_PEER_ADDRESS=localhost:7051
}


# Check if "bin" directory doesn't exist and install-fabric.sh doesn't exist
if [ ! -d "bin" ] && [ ! -f "install-fabric.sh" ]; then
  curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh && chmod +x install-fabric.sh
  ./install-fabric.sh b
fi

# Check if "bin" directory doesn't exist but install-fabric.sh exists
if [ ! -d "bin" ]; then
  ./install-fabric.sh b
fi

# Check if "peer", "osnadmin", "cryptogen", and "configtxgen" are in PATH
if ! command_exists peer || ! command_exists osnadmin || ! command_exists cryptogen || ! command_exists configtxgen; then
  # Add "./bin" folder to PATH
  export PATH="$PATH:./bin"

  # Check again after modifying PATH
  if ! command_exists peer || ! command_exists osnadmin || ! command_exists cryptogen || ! command_exists configtxgen; then
    echo "Hyperledger Binaries aren't installed."
    exit 1
  fi
fi

echo "Binaries of Hyperledger Tools are installed, proceeding with launching the network."

echo "Hardcoding DOCKER_SOCK variable as /var/run/docker.sock"
export DOCKER_SOCK=/var/run/docker.sock

generateOrgs

rm -rf container-data channel-artifacts

docker compose -f ./compose/docker-compose.yaml up -d

echo "Creating genesis block from configtx.yaml"
configtxgen -profile OneOrgOneOrdGenesis -outputBlock channel-artifacts/mychannel.block -channelID mychannel -configPath configtx/

echo "Sending genesis block to orderer to create channel"
setGeneralVars
setOrg1Vars
export CHANNEL_NAME=mychannel
osnadmin channel join --channelID $CHANNEL_NAME --config-block ./channel-artifacts/${CHANNEL_NAME}.block -o localhost:7053 --ca-file "$ORDERER_CA" --client-cert "$ORDERER_ADMIN_TLS_SIGN_CERT" --client-key "$ORDERER_ADMIN_TLS_PRIVATE_KEY" >&log.txt

echo "Join Org1 to channel"
export FABRIC_CFG_PATH=${PWD}/config/
peer channel join -b ./channel-artifacts/$CHANNEL_NAME.block >&log.txt

