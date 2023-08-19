#!/bin/bash
function echoln() {
    echo -e "$1"
}

Red='\033[0;31m'    # Red
Green='\033[0;32m'  # Green
Blue='\033[0;34m'   # Blue
Color_Off='\033[0m' # Text Reset

function succesln() {
    echoln "${Green}$1${Color_Off}"
}

function failln() {
    echoln "${Red}$1${Color_Off}"
}

if [ -z "$1" ]; then
    echoln "No argument supplied, please specify ${Blue}\"up\"${Color_Off} to bring up the network, ${Blue}\"down\"${Color_Off} to bring down the ENTIRE network, or ${Blue}\"kill-gateway\"${Color_Off}"
    exit 1
fi

composeFileName="threeClusters.yaml"

if [ "$1" = "up" ]; then

    echoln "\n\nBringing network up!"

    echoln "\nLaunching fabric network."
    pushd hyperledger-fabric-setup
    ./runThreeOrgOneOrdNetwork.sh >/dev/null 2>&1 &
    pid1=$!
    popd

    echoln "\nLaunching IPFS network."
    pushd ipfs
    docker compose -f $composeFileName up -d >/dev/null 2>&1 &
    pid2=$!
    popd

    # Wait for both background processes to complete
    wait $pid1
    exit_code1=$?

    if [ $exit_code1 -ne 0 ]; then
        failln "\nError: Failed to launch fabric network. Exiting...\n"
        exit 1
    fi

    wait $pid2
    exit_code2=$?

    if [ $exit_code2 -ne 0 ]; then
        failln "\nError: Failed to launch IPFS network. Exiting...\n"
        exit 1
    fi

    docker ps -a

    succesln "\nNetwork up!"
    echoln "\nNow bringing up the gateway server and gateway web app."

    pushd local-gateway

    npm install &
    wait $!

    npm run start:org1 >/dev/null 2>&1 &
    pidGateway=$!
    popd

    pushd local-gateway-web-app

    npm install &
    wait $!

    npm run start >/dev/null 2>&1 &
    pidWebapp=$!
    popd

    sleep 1

    if ! ps -p $pidGateway >/dev/null || ! ps -p $pidWebapp >/dev/null; then
        failln "\nError: looks like gateway or gateway web app crashed. Exiting."
        exit 1
    fi

    succesln "\n Local Gateway and Local Gateway Web App are up!"
    echoln "PID of Local Gateway is: $pidGateway, and PID of the web app is: $pidWebapp"

    exit 0
fi

if [ "$1" = "down" ]; then
    echoln "\n\nBringing network down!\n\n"

    pushd hyperledger-fabric-setup
    (./runThreeOrgOneOrdNetwork.sh down)
    pid1=$!
    popd

    pushd ipfs
    (docker compose -f $composeFileName down)
    pid2=$!
    popd

    # Wait for both background processes to complete
    wait $pid1
    exit_code1=$?
    if [ $exit_code1 -ne 0 ]; then
        failln "\nError: Failed to remove fabric network. Exiting...\n"
        exit 1
    fi

    wait $pid2
    exit_code2=$?
    if [ $exit_code2 -ne 0 ]; then
        failln "\nError: Failed to remove IPFS network. Exiting...\n"
        exit 1
    fi

    succesln "Brought networks down, now bringing down NodeJS apps".

    pidGateway=$(ps aux | grep node | grep "localGateway" | awk '{print $2}')
    pidWebapp=$(ps aux | grep node | grep "local-gateway-web-app.*start.js" | awk '{print $2}')

    echo "PID of Gateway: $pidGateway"
    echo "PID of Webapp: $pidWebapp"

    kill $pidGateway
    kill $pidWebapp

    succesln "\n\nNetwork brought down successfully\n\n"
    exit 0
fi

if [ "$1" = "kill-gateway" ]; then
    echoln "\nKilling the Local Gateway process!\n"
    pidGateway=$(ps aux | grep node | grep "localGateway" | awk '{print $2}')
    if [ -z "$pidGateway" ]; then
        failln "Local Gateway process does not seem to be running anyways. Exiting..."
        exit 1
    else
        echo "PID of Gateway: $pidGateway"
        kill $pidGateway
        succesln "\nKilled Local Gateway successfully\n\n"
        exit 0
    fi
fi
