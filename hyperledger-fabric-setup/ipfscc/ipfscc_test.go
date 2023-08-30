/*
Official documentation of Hyperledger Fabric does not say much about writing unit tests for smart contracts written in Golang.
However, we were able to find and reference some unit tests in the sample projects repository, for which we provide a reference below:

- https://github.com/hyperledger/fabric-samples/tree/main/asset-transfer-private-data/chaincode-go/chaincode

*/

package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"ipfscc/mocks"
	"os"
	"testing"

	"github.com/hyperledger/fabric-chaincode-go/pkg/cid"
	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/hyperledger/fabric-protos-go/ledger/queryresult"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

//go:generate go run github.com/maxbrunsfeld/counterfeiter/v6 -o mocks/transaction.go -fake-name TransactionContext . transactionContext
type transactionContext interface {
	contractapi.TransactionContextInterface
}

//go:generate go run github.com/maxbrunsfeld/counterfeiter/v6 -o mocks/chaincodestub.go -fake-name ChaincodeStub . chaincodeStub
type chaincodeStub interface {
	shim.ChaincodeStubInterface
}

//go:generate go run github.com/maxbrunsfeld/counterfeiter/v6 -o mocks/statequeryiterator.go -fake-name StateQueryIterator . stateQueryIterator
type stateQueryIterator interface {
	shim.StateQueryIteratorInterface
}

//go:generate go run github.com/maxbrunsfeld/counterfeiter/v6 -o mocks/clientIdentity.go -fake-name ClientIdentity . clientIdentity
type clientIdentity interface {
	cid.ClientIdentity
}

type transientInputForKey struct {
	SymmetricKey string `json:"symmetricKey"`
}

const myOrg1Msp = "Org1Testmsp"
const myOrg1Clientid = "myOrg1Userid"

const testDeviceName = "testDevice_4000"
const testCID = "42421337"
const testDataDate = "02-02-2000"
const testEncryptionKey = "a1234"

func TestCreateAssetID(t *testing.T) {
	// Use require here because if this function doesn't work, everything is bound to be false, and we use it in the tests for some assertions too!
	assetId := CreateAssetID(testDeviceName, testDataDate)

	expectedAssetId := "data_" + testDeviceName + "_" + testDataDate

	require.Equal(t, assetId, expectedAssetId)
}

func TestUploadDataAsAsset(t *testing.T) {
	transactionContext, chaincodeStub := prepMocks(myOrg1Msp, myOrg1Clientid)
	assetTransferCC := SmartContract{}

	// No transient map
	err := assetTransferCC.UploadDataAsAsset(transactionContext, testDeviceName, testCID, testDataDate)
	assert.NoError(t, err)
	putStateCallCount := chaincodeStub.PutStateCallCount()
	assert.Equal(t, putStateCallCount, 1)

	key, _ := chaincodeStub.PutStateArgsForCall(0)
	assert.Equal(t, key, "data_"+testDeviceName+"_"+testDataDate)
}

func TestUploadKeyPrivate(t *testing.T) {
	transactionContext, chaincodeStub := prepMocks(myOrg1Msp, myOrg1Clientid)
	assetTransferCC := SmartContract{}

	symmetricKeyBytes := []byte(testEncryptionKey)
	assetPropMap := map[string][]byte{
		"symmetricKey": symmetricKeyBytes,
	}
	chaincodeStub.GetTransientReturns(assetPropMap, nil)

	err := assetTransferCC.UploadKeyPrivateData(transactionContext, testDeviceName, testCID, testDataDate)
	assert.NoError(t, err)

	privateDataCallCount := chaincodeStub.PutPrivateDataCallCount()
	assert.Equal(t, 1, privateDataCallCount)

	getTransientCallCount := chaincodeStub.GetTransientCallCount()
	assert.Equal(t, 1, getTransientCallCount)

	expectedKeyData := KeyCIDAsset{
		Date:         testDataDate,
		DeviceName:   testDeviceName,
		IPFS_CID:     testCID,
		SymmetricKey: testEncryptionKey,
	}

	expectedPrivateDataBytes, _ := json.Marshal(expectedKeyData)
	expectedCollectionName := "_implicit_org_" + myOrg1Msp
	expectedAssetKey := CreateAssetID(testDeviceName, testDataDate)
	collectionName, assetKey, privateDataBytes := chaincodeStub.PutPrivateDataArgsForCall(0)

	assert.Equal(t, expectedCollectionName, collectionName)
	assert.Equal(t, expectedAssetKey, assetKey)
	assert.Equal(t, expectedPrivateDataBytes, privateDataBytes)
}

func TestGetKeyPrivateData(t *testing.T) {
	transactionContext, chaincodeStub := prepMocks(myOrg1Msp, myOrg1Clientid)
	assetTransferCC := SmartContract{}

	expectedKeyAsset := KeyCIDAsset{
		Date:         testDataDate,
		DeviceName:   testDeviceName,
		IPFS_CID:     testCID,
		SymmetricKey: testEncryptionKey,
	}
	expectedKeyAssetBytes, _ := json.Marshal(expectedKeyAsset)

	chaincodeStub.GetPrivateDataReturns(expectedKeyAssetBytes, nil)

	// Expects assetKey to be in format of <deviceName>_<date>
	keyAsset, err := assetTransferCC.GetKeyPrivateData(transactionContext, testDeviceName+"_"+testDataDate)
	assert.NoError(t, err)
	assert.Equal(t, keyAsset.SymmetricKey, testEncryptionKey)
}

func TestGetMyOrgsDataAssets(t *testing.T) {
	// Test if it returns nothing, since data isn't owned by my org
	transactionContext, chaincodeStub := prepMocks(myOrg1Msp, myOrg1Clientid)
	assetTransferCC := SmartContract{}

	asset := DataAsset{
		AssetName: testDeviceName,
		Date:      testDataDate,
		IPFS_CID:  testCID,
		OwnerOrg:  "anotherOrgsName, return should be empty!",
	}
	assetBytes, _ := json.Marshal(asset)

	mockIterator := &mocks.StateQueryIterator{}
	mockIterator.HasNextReturnsOnCall(0, true)
	mockIterator.HasNextReturnsOnCall(1, false)
	mockIterator.NextReturns(&queryresult.KV{Value: assetBytes}, nil)

	chaincodeStub.GetStateByRangeReturns(mockIterator, nil)

	assets, err := assetTransferCC.GetMyOrgsDataAssets(transactionContext)
	assert.NoError(t, err)

	getStateByRangeCallCount := chaincodeStub.GetStateByRangeCallCount()
	assert.Equal(t, getStateByRangeCallCount, 1)

	assert.Equal(t, len(assets), 0)
	assert.IsType(t, []*DataAsset{}, assets)

	// Test if it returns the assets now, since the owner org is my org.
	asset = DataAsset{
		AssetName: testDeviceName,
		Date:      testDataDate,
		IPFS_CID:  testCID,
		OwnerOrg:  myOrg1Msp,
	}
	assetBytes, _ = json.Marshal(asset)

	mockIterator = &mocks.StateQueryIterator{}
	mockIterator.HasNextReturnsOnCall(0, true)
	mockIterator.HasNextReturnsOnCall(1, false)
	mockIterator.NextReturns(&queryresult.KV{Value: assetBytes}, nil)

	chaincodeStub.GetStateByRangeReturns(mockIterator, nil)

	assets, err = assetTransferCC.GetMyOrgsDataAssets(transactionContext)
	assert.NoError(t, err)

	getStateByRangeCallCount = chaincodeStub.GetStateByRangeCallCount()
	assert.Equal(t, getStateByRangeCallCount, 2)

	assert.Equal(t, len(assets), 1)
	assert.IsType(t, []*DataAsset{}, assets)
}

func TestTransferEncKey(t *testing.T) {
	transactionContext, chaincodeStub := prepMocks(myOrg1Msp, myOrg1Clientid)
	assetTransferCC := SmartContract{}

	testNewOwnerOrg := "newOwnerOrg"

	asset := DataAsset{
		AssetName: testDeviceName,
		Date:      testDataDate,
		IPFS_CID:  testCID,
		OwnerOrg:  "anotherOrgsData",
	}
	assetBytes, _ := json.Marshal(asset)
	chaincodeStub.GetStateReturnsOnCall(0, assetBytes, nil)

	symmetricKeyBytes := []byte(testEncryptionKey)
	assetPropMap := map[string][]byte{
		"symmetricKey": symmetricKeyBytes,
	}
	chaincodeStub.GetTransientReturns(assetPropMap, nil)

	err := assetTransferCC.TransferEncKey(transactionContext, testNewOwnerOrg, testDeviceName, testDataDate)
	assert.NoError(t, err)

	_, _, argBytes := chaincodeStub.PutPrivateDataArgsForCall(0)
	var argData KeyCIDAsset
	json.Unmarshal(argBytes, &argData)
	assert.Equal(t, argData.IPFS_CID, testCID)
	assert.Equal(t, argData.SymmetricKey, testEncryptionKey)
}

func TestGetOtherOrgsDataAssets(t *testing.T) {
	// Test if it returns the assets, because none of it is owned by my org
	transactionContext, chaincodeStub := prepMocks(myOrg1Msp, myOrg1Clientid)
	assetTransferCC := SmartContract{}

	asset := DataAsset{
		AssetName: testDeviceName,
		Date:      testDataDate,
		IPFS_CID:  testCID,
		OwnerOrg:  "anotherOrgsData",
	}
	assetBytes, _ := json.Marshal(asset)

	mockIterator := &mocks.StateQueryIterator{}
	mockIterator.HasNextReturnsOnCall(0, true)
	mockIterator.HasNextReturnsOnCall(1, false)
	mockIterator.NextReturns(&queryresult.KV{Value: assetBytes}, nil)

	chaincodeStub.GetStateByRangeReturns(mockIterator, nil)

	assets, err := assetTransferCC.GetOtherOrgsDataAssets(transactionContext)
	assert.NoError(t, err)

	getStateByRangeCallCount := chaincodeStub.GetStateByRangeCallCount()
	assert.Equal(t, getStateByRangeCallCount, 1)

	assert.Equal(t, len(assets), 1)
	assert.IsType(t, []*DataAsset{}, assets)

	// Now test if it returns empty, because all assets belong to my org
	asset = DataAsset{
		AssetName: testDeviceName,
		Date:      testDataDate,
		IPFS_CID:  testCID,
		OwnerOrg:  myOrg1Msp,
	}
	assetBytes, _ = json.Marshal(asset)

	mockIterator = &mocks.StateQueryIterator{}
	mockIterator.HasNextReturnsOnCall(0, true)
	mockIterator.HasNextReturnsOnCall(1, false)
	mockIterator.NextReturns(&queryresult.KV{Value: assetBytes}, nil)

	chaincodeStub.GetStateByRangeReturns(mockIterator, nil)

	assets, err = assetTransferCC.GetOtherOrgsDataAssets(transactionContext)
	assert.NoError(t, err)

	getStateByRangeCallCount = chaincodeStub.GetStateByRangeCallCount()
	assert.Equal(t, getStateByRangeCallCount, 2)

	assert.Equal(t, len(assets), 0)
	assert.IsType(t, []*DataAsset{}, assets)
}

func TestGetAllDataAssets(t *testing.T) {
	transactionContext, chaincodeStub := prepMocks(myOrg1Msp, myOrg1Clientid)
	assetTransferCC := SmartContract{}
	sampleOtherOrgName := "anotherOrg"
	mockIterator := getMockStateByRangeIterator(sampleOtherOrgName)

	chaincodeStub.GetStateByRangeReturns(mockIterator, nil)

	allAssets, err := assetTransferCC.GetAllDataAssets(transactionContext)
	assert.NoError(t, err)
	assert.IsType(t, allAssets, []*DataAsset{})
	assert.Equal(t, allAssets[0].OwnerOrg, sampleOtherOrgName)
}

func TestGetAssetOwner(t *testing.T) {
	transactionContext, chaincodeStub := prepMocks(myOrg1Msp, myOrg1Clientid)
	assetTransferCC := SmartContract{}

	expectedAsset := DataAsset{
		AssetName: testDeviceName,
		Date:      testDataDate,
		IPFS_CID:  testCID,
		OwnerOrg:  myOrg1Msp,
	}
	expectedAssetBytes, _ := json.Marshal(expectedAsset)

	chaincodeStub.GetStateReturnsOnCall(0, expectedAssetBytes, nil)

	assetOwner, err := assetTransferCC.GetAssetOwner(transactionContext, testDeviceName, testDataDate)

	assert.NoError(t, err)
	assert.Equal(t, assetOwner, myOrg1Msp)
}

func TestGetAssetByID(t *testing.T) {
	transactionContext, chaincodeStub := prepMocks(myOrg1Msp, myOrg1Clientid)
	assetTransferCC := SmartContract{}

	expectedAsset := DataAsset{
		AssetName: testDeviceName,
		Date:      testDataDate,
		IPFS_CID:  testCID,
		OwnerOrg:  myOrg1Msp,
	}
	expectedAssetBytes, _ := json.Marshal(expectedAsset)

	chaincodeStub.GetStateReturnsOnCall(0, expectedAssetBytes, nil)

	mockAssetId := testDeviceName + "_" + testDataDate
	asset, err := assetTransferCC.GetAssetByID(transactionContext, mockAssetId)
	assert.NoError(t, err)
	getStateArgsForCall := chaincodeStub.GetStateArgsForCall(0)
	assert.Equal(t, getStateArgsForCall, "data_"+mockAssetId)
	assert.Equal(t, asset.OwnerOrg, myOrg1Msp)
}

func TestGetBidsForMyOrg(t *testing.T) {
	transactionContext, chaincodeStub := prepMocks(myOrg1Msp, myOrg1Clientid)
	assetTransferCC := SmartContract{}

	const testBidPrice = "999"
	const biddingOrg = "biddingOrg"

	expectedBid := DataBid{
		AdditionalCommitments: "",
		BiddingOrg:            biddingOrg,
		CurrentOwnerOrg:       myOrg1Msp,
		DeviceName:            testDeviceName,
		Date:                  testDataDate,
		Price:                 testBidPrice,
		Active:                true,
	}
	expectedBidBytes, _ := json.Marshal(expectedBid)

	mockIterator := &mocks.StateQueryIterator{}
	mockIterator.HasNextReturnsOnCall(0, true)
	mockIterator.HasNextReturnsOnCall(1, false)
	mockIterator.NextReturns(&queryresult.KV{Value: expectedBidBytes}, nil)

	chaincodeStub.GetStateByRangeReturns(mockIterator, nil)

	bidsForMyOrg, err := assetTransferCC.GetBidsForMyOrg(transactionContext)
	argOne, argTwo := chaincodeStub.GetStateByRangeArgsForCall(0)
	assert.NoError(t, err)
	assert.Equal(t, bidsForMyOrg[0].Price, testBidPrice)
	assert.Equal(t, argOne, "bid_")
	assert.Equal(t, argTwo, "bid_~")
}

func TestAcceptBid(t *testing.T) {
	transactionContext, chaincodeStub := prepMocks(myOrg1Msp, myOrg1Clientid)
	assetTransferCC := SmartContract{}

	const testBidPrice = "1001"
	const biddingOrg = "biddingOrg"

	// expectedbidID := "bid_" + testDeviceName + "_" + testDataDate + "_" + myOrg1Msp + "_" + biddingOrg
	expectedBid := DataBid{
		AdditionalCommitments: "",
		BiddingOrg:            biddingOrg,
		CurrentOwnerOrg:       myOrg1Msp,
		DeviceName:            testDeviceName,
		Date:                  testDataDate,
		Price:                 testBidPrice,
		Active:                true,
	}
	expectedBidBytes, _ := json.Marshal(expectedBid)

	chaincodeStub.GetStateReturnsOnCall(0, expectedBidBytes, nil)

	expectedAsset := DataAsset{
		AssetName: testDeviceName,
		Date:      testDataDate,
		IPFS_CID:  testCID,
		OwnerOrg:  myOrg1Msp,
	}
	expectedAssetBytes, _ := json.Marshal(expectedAsset)

	chaincodeStub.GetStateReturnsOnCall(1, expectedAssetBytes, nil)

	mockIterator := &mocks.StateQueryIterator{}
	mockIterator.HasNextReturnsOnCall(0, true)
	mockIterator.HasNextReturnsOnCall(1, false)
	mockIterator.NextReturns(&queryresult.KV{Value: expectedBidBytes}, nil)

	chaincodeStub.GetStateByRangeReturns(mockIterator, nil)
	// bidBytes, err := chaincodeStub.GetState(expectedbidID)

	err := assetTransferCC.AcceptBid(transactionContext, biddingOrg, testDeviceName, testDataDate, testBidPrice)
	assert.NoError(t, err)
	_, newDataAssetBytes := chaincodeStub.PutStateArgsForCall(1)

	var newDataAsset DataAsset
	err = json.Unmarshal(newDataAssetBytes, &newDataAsset)
	fmt.Println(newDataAsset)
	assert.NoError(t, err)
	assert.Equal(t, biddingOrg, newDataAsset.OwnerOrg)
}

func TestBidForData(t *testing.T) {
	transactionContext, chaincodeStub := prepMocks(myOrg1Msp, myOrg1Clientid)
	assetTransferCC := SmartContract{}

	const testBidPrice = "1001"
	const testBidCommitments = "no commitments"
	const otherOwnerOrg = "otherOwnerOrg"

	expectedAsset := DataAsset{
		AssetName: testDeviceName,
		Date:      testDataDate,
		IPFS_CID:  testCID,
		OwnerOrg:  otherOwnerOrg,
	}
	expectedAssetBytes, _ := json.Marshal(expectedAsset)

	chaincodeStub.GetStateReturnsOnCall(0, expectedAssetBytes, nil)

	err := assetTransferCC.BidForData(transactionContext, testDeviceName, testDataDate, testBidPrice, testBidCommitments)
	assert.NoError(t, err)

	_, putStateArgBytes := chaincodeStub.PutStateArgsForCall(0)
	var putStateArg DataBid
	err = json.Unmarshal(putStateArgBytes, &putStateArg)
	assert.NoError(t, err)
	assert.True(t, putStateArg.Active)
	assert.Equal(t, putStateArg.BiddingOrg, myOrg1Msp)
}

func TestInactivateAllBidsForThisData(t *testing.T) {
	transactionContext, chaincodeStub := prepMocks(myOrg1Msp, myOrg1Clientid)
	assetTransferCC := SmartContract{}

	const testBidPrice = "1001"
	const biddingOrg = "biddingOrg"

	expectedBid := DataBid{
		AdditionalCommitments: "",
		BiddingOrg:            biddingOrg,
		CurrentOwnerOrg:       myOrg1Msp,
		DeviceName:            testDeviceName,
		Date:                  testDataDate,
		Price:                 testBidPrice,
		Active:                true,
	}
	expectedBidBytes, _ := json.Marshal(expectedBid)

	mockIterator := &mocks.StateQueryIterator{}
	mockIterator.HasNextReturnsOnCall(0, true)
	mockIterator.HasNextReturnsOnCall(1, false)
	mockIterator.NextReturns(&queryresult.KV{Value: expectedBidBytes}, nil)

	chaincodeStub.GetStateByRangeReturns(mockIterator, nil)

	err := assetTransferCC.InactivateAllBidsForThisData(transactionContext, myOrg1Msp, testDeviceName, testDataDate)
	assert.NoError(t, err)

	_, putStateBytes := chaincodeStub.PutStateArgsForCall(0)
	var putState DataBid
	err = json.Unmarshal(putStateBytes, &putState)
	assert.NoError(t, err)
	assert.False(t, putState.Active)
}

func prepMocks(orgMSP, clientId string) (*mocks.TransactionContext, *mocks.ChaincodeStub) {
	chaincodeStub := &mocks.ChaincodeStub{}
	transactionContext := &mocks.TransactionContext{}
	transactionContext.GetStubReturns(chaincodeStub)

	clientIdentity := &mocks.ClientIdentity{}
	clientIdentity.GetMSPIDReturns(orgMSP, nil)
	clientIdentity.GetIDReturns(base64.StdEncoding.EncodeToString([]byte(clientId)), nil)
	// set matching msp ID using peer shim env variable
	os.Setenv("CORE_PEER_LOCALMSPID", orgMSP)
	transactionContext.GetClientIdentityReturns(clientIdentity)
	return transactionContext, chaincodeStub
}

func getMockStateByRangeIterator(ownerOrg string) *mocks.StateQueryIterator {
	asset := DataAsset{
		AssetName: testDeviceName,
		Date:      testDataDate,
		IPFS_CID:  testCID,
		OwnerOrg:  ownerOrg,
	}
	assetBytes, _ := json.Marshal(asset)

	mockIterator := &mocks.StateQueryIterator{}
	mockIterator.HasNextReturnsOnCall(0, true)
	mockIterator.HasNextReturnsOnCall(1, false)
	mockIterator.NextReturns(&queryresult.KV{Value: assetBytes}, nil)

	return mockIterator
}
