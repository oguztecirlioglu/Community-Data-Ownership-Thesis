package Main_test

import (
	"encoding/base64"
	"encoding/json"
	Main "ipfscc"
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
	assetId := Main.CreateAssetID(testDeviceName, testDataDate)

	expectedAssetId := "data_" + testDeviceName + "_" + testDataDate

	require.Equal(t, assetId, expectedAssetId)
}

func TestUploadDataAsAsset(t *testing.T) {
	transactionContext, chaincodeStub := prepMocks(myOrg1Msp, myOrg1Clientid)
	assetTransferCC := Main.SmartContract{}

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
	assetTransferCC := Main.SmartContract{}

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

	expectedKeyData := Main.KeyCIDAsset{
		Date:         testDataDate,
		DeviceName:   testDeviceName,
		IPFS_CID:     testCID,
		SymmetricKey: testEncryptionKey,
	}

	expectedPrivateDataBytes, _ := json.Marshal(expectedKeyData)
	expectedCollectionName := "_implicit_org_" + myOrg1Msp
	expectedAssetKey := Main.CreateAssetID(testDeviceName, testDataDate)
	collectionName, assetKey, privateDataBytes := chaincodeStub.PutPrivateDataArgsForCall(0)

	assert.Equal(t, expectedCollectionName, collectionName)
	assert.Equal(t, expectedAssetKey, assetKey)
	assert.Equal(t, expectedPrivateDataBytes, privateDataBytes)
}

func TestGetMyOrgsDataAssets(t *testing.T) {
	// Test if it returns nothing, since data isn't owned by my org
	transactionContext, chaincodeStub := prepMocks(myOrg1Msp, myOrg1Clientid)
	assetTransferCC := Main.SmartContract{}

	asset := Main.DataAsset{
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
	assert.IsType(t, []*Main.DataAsset{}, assets)

	// Test if it returns the assets now, since the owner org is my org.
	asset = Main.DataAsset{
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
	assert.IsType(t, []*Main.DataAsset{}, assets)
}

func TestGetOtherOrgsDataAssets(t *testing.T) {
	// Test if it returns the assets, because none of it is owned by my org
	transactionContext, chaincodeStub := prepMocks(myOrg1Msp, myOrg1Clientid)
	assetTransferCC := Main.SmartContract{}

	asset := Main.DataAsset{
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
	assert.IsType(t, []*Main.DataAsset{}, assets)

	// Now test if it returns empty, because all assets belong to my org
	asset = Main.DataAsset{
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
	assert.IsType(t, []*Main.DataAsset{}, assets)
}

func TestAcceptBid(t *testing.T) {
	transactionContext, chaincodeStub := prepMocks(myOrg1Msp, myOrg1Clientid)
	assetTransferCC := Main.SmartContract{}

	const testBidPrice = "1001"
	const biddingOrg = "biddingOrg"

	// expectedbidID := "bid_" + testDeviceName + "_" + testDataDate + "_" + myOrg1Msp + "_" + biddingOrg
	expectedBid := Main.DataBid{
		AdditionalCommitments: "",
		BiddingOrg:            biddingOrg,
		CurrentOwnerOrg:       myOrg1Msp,
		DeviceName:            testDeviceName,
		Date:                  testDataDate,
		Price:                 testBidPrice,
		Active:                true,
	}
	expectedBidBytes, _ := json.Marshal(expectedBid)

	chaincodeStub.GetStateReturns(expectedBidBytes, nil)

	mockIterator := &mocks.StateQueryIterator{}
	mockIterator.HasNextReturnsOnCall(0, true)
	mockIterator.HasNextReturnsOnCall(1, false)
	mockIterator.NextReturns(&queryresult.KV{Value: expectedBidBytes}, nil)

	chaincodeStub.GetStateByRangeReturns(mockIterator, nil)
	// bidBytes, err := chaincodeStub.GetState(expectedbidID)

	err := assetTransferCC.AcceptBid(transactionContext, biddingOrg, testDeviceName, testDataDate, testBidPrice)
	require.NoError(t, err)
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
