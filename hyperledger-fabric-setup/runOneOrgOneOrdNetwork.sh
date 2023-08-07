# Function to check if a command exists in PATH
function command_exists() {
  command -v "$1" >/dev/null 2>&1
}

function generateOrgs() {
  rm -rf organizations

  echoln "Generating crypto material for Org1"
  cryptogen generate --config=compose/crypto-config-org1.yaml --output="organizations"
  if [ $? -ne 0 ]; then
    echoln "Failed to generate certificate for org1"
    exit 1
  fi

  echoln "Generating crypto material for Orderer"
  cryptogen generate --config=compose/crypto-config-orderer.yaml --output="organizations"
  if [ $? -ne 0 ]; then
    echoln "Failed to generate certificate for Orderer"
    exit 1
  fi

  echoln "Successfully generated all Org material"
}

function setGeneralVars() {
  export CORE_PEER_TLS_ENABLED=true
  export ORDERER_CA=${PWD}/organizations/ordererOrganizations/fabrictest.com/tlsca/tlsca.fabrictest.com-cert.pem
  export PEER0_ORG1_CA=${PWD}/organizations/peerOrganizations/org1.fabrictest.com/tlsca/tlsca.org1.fabrictest.com-cert.pem
  export ORDERER_ADMIN_TLS_SIGN_CERT=${PWD}/organizations/ordererOrganizations/fabrictest.com/orderers/orderer.fabrictest.com/tls/server.crt
  export ORDERER_ADMIN_TLS_PRIVATE_KEY=${PWD}/organizations/ordererOrganizations/fabrictest.com/orderers/orderer.fabrictest.com/tls/server.key

  export CHANNEL_NAME=mychannel
  # export DOCKER_SOCK=/var/run/docker.sock

  export CC_SRC_PATH="ipfscc"
  export CC_NAME="ipfscc"
  export CC_VERSION="1.0"
  export CC_SRC_LANGUAGE="go"
  export CC_SEQUENCE="1"
  export CC_END_POLICY="NA"
  export CC_COLL_CONFIG="NA"
  export CC_INIT_FCN="NA"
  export CC_RUNTIME_LANGUAGE=golang

  export DELAY="3"
  export MAX_RETRY="5"

}

function setOrg1Vars() {
  export CORE_PEER_LOCALMSPID="Org1MSP"
  export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG1_CA
  export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.fabrictest.com/users/Admin@org1.fabrictest.com/msp
  export CORE_PEER_ADDRESS=localhost:7051
}

function echoln() {
  echo -e "$1"
}

function checkAndThrowError() {
  code=$1
  errorMessage=$2
  if [ $code -ne 0 ]; then
    # ANSI escape code for red color
    red='\033[0;31m'
    # ANSI escape code to reset text color
    reset='\033[0m'

    # Print the error message in red color and exit the script
    echo -e "${red}Error: ${errorMessage}${reset}" >&2
    exit 1
  fi
}

function removeChaincodeImages() {
  containerTags=$(docker ps -a | grep dev-peer.* | awk '{print $1}')
  docker container rm $containerTags
  imageTags=$(docker image ls -a | grep dev-peer.* | awk '{ print $1 }')
  docker image rm $imageTags
}

if [ "$1" = "down" ]; then
  echoln "\n\nBringing network down!\n\n"
  docker-compose -f ./compose/docker-compose.yaml down
  rm -rf container-data channel-artifacts
  echoln "\n\nNetwork down successfully\n\n"

  removeChaincodeImages
  exit 0
fi

# Check if "bin" directory doesn't exist and install-fabric.sh doesn't exist
if [ ! -d "bin" ] && [ ! -f "install-fabric.sh" ]; then
  curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh && chmod +x install-fabric.sh
  ./install-fabric.sh b
  rm -rf ./config #These config files are not setup for our network, so get rid of them.
fi

# Check if "bin" directory doesn't exist but install-fabric.sh exists
if [ ! -d "bin" ]; then
  ./install-fabric.sh b
  rm -rf ./config #These config files are not setup for our network, so get rid of them.
fi

# Check if "peer", "osnadmin", "cryptogen", and "configtxgen" are in PATH
if ! command_exists peer || ! command_exists osnadmin || ! command_exists cryptogen || ! command_exists configtxgen; then
  # Add "./bin" folder to PATH
  export PATH="$PATH:${PWD}/bin"

  # Check again after modifying PATH
  if ! command_exists peer || ! command_exists osnadmin || ! command_exists cryptogen || ! command_exists configtxgen; then
    echoln "Hyperledger Binaries aren't installed."
    exit 1
  fi
fi

echoln "Binaries of Hyperledger Tools are installed, proceeding with launching the network."

setGeneralVars
setOrg1Vars

###
### GENERATE ORGS & RUN DOCKER NETWORK
###

SOCK="${DOCKER_HOST:-/var/run/docker.sock}"
DOCKER_SOCK="${SOCK##unix://}"

docker compose -f ./compose/docker-compose.yaml down

generateOrgs

rm -rf container-data channel-artifacts

DOCKER_SOCK="${DOCKER_SOCK}" docker compose -f ./compose/docker-compose.yaml up -d 2>&1

###
### CREATE CHANNEL AND JOIN PEER
###

BLOCKFILE=channel-artifacts/$CHANNEL_NAME.block

export FABRIC_CFG_PATH=${PWD}/configFiles

echoln "Creating genesis block from configtx.yaml"
configtxgen -profile OneOrgOneOrdGenesis -outputBlock ./channel-artifacts/mychannel.block -channelID mychannel -configPath ./configFiles
checkAndThrowError $? "Create genesis block failed"

echoln "Create channel"
osnadmin channel join --channelID "$CHANNEL_NAME" --config-block "$BLOCKFILE" -o localhost:7053 --ca-file "$ORDERER_CA" --client-cert "$ORDERER_ADMIN_TLS_SIGN_CERT" --client-key "$ORDERER_ADMIN_TLS_PRIVATE_KEY"
checkAndThrowError $? "Create channel failed"
echoln "Created Channel succesfully \n"

echoln "Join Org1 to channel"
peer channel join -b ./channel-artifacts/$CHANNEL_NAME.block
echoln "Org1 joined to channel successfully \n"

###
### INSTALL & DEPLOY CHAINCODE ON CHANNEL
###

echoln "Install Chaincode on channel"
echoln "Get and Package Go dependencies at $CC_SRC_PATH"
pushd $CC_SRC_PATH
GO111MODULE=on go mod vendor
popd

echoln "Package Chaincode"
peer lifecycle chaincode package "$CC_SRC_PATH/$CC_NAME.tar.gz" -p ${CC_SRC_PATH} --lang golang --label ${CC_NAME}_${CC_VERSION}
checkAndThrowError $? "Chaincode package failed"
export PACKAGE_ID=$(peer lifecycle chaincode calculatepackageid "$CC_SRC_PATH/$CC_NAME.tar.gz")
echoln "Chaincode Packaged"

echoln "Install and approve chaincode for org"

peer lifecycle chaincode install "$CC_SRC_PATH/$CC_NAME.tar.gz"
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.fabrictest.com --tls --cafile "$ORDERER_CA" --channelID $CHANNEL_NAME --name $CC_NAME --version $CC_VERSION --package-id $PACKAGE_ID --sequence 1

checkAndThrowError $? "Chaincode install and approve failed"
echoln "Chaincode installed and approved for org"

echoln "Commit chaincode"

peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.fabrictest.com --tls --cafile "$ORDERER_CA" --channelID $CHANNEL_NAME --name $CC_NAME --peerAddresses localhost:7051 --tlsRootCertFiles "$PEER0_ORG1_CA" --version $CC_VERSION --sequence 1
checkAndThrowError $? "Chaincode commit failed"

echoln "Succesfully committed chaincode"
