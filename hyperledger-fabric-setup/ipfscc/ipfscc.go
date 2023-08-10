package main

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract provides functions for managing an Asset
type SmartContract struct {
	contractapi.Contract
}

type DataAsset struct {
	AssetName string `json:"assetName"`
	Date      string `json:"date"`
	IPFS_CID  string `json:"IPFS_CID"`
	OwnerOrg  string `json:"ownerOrg"`
}

type KeyCIDAsset struct {
	Date         string `json:"date"`
	DeviceName   string `json:"deviceName"`
	IPFS_CID     string `json:"IPFS_CID"`
	SymmetricKey string `json:"symmetricKey"`
}

type BidApproval struct {
	Date             string `json:"date"`
	DeviceName       string `json:"deviceName"`
	NewOwnerOrg      string `json:"newOwnerOrg"`
	OriginalOwnerOrg string `json:"originalOwnerOrg"`
}

type DataBid struct {
	AdditionalCommitments string `json:"additionalCommitments"`
	BiddingOrg            string `json:"biddingOrg"`
	CurrentOwnerOrg       string `json:"currentOwnerOrg"`
	DeviceName            string `json:"deviceName"`
	Date                  string `json:"date"`
	Price                 string `json:"price"`
	Active                bool   `json:"active"`
}

func CreateAssetID(deviceName string, date string) (assetID string) {
	result := "data_" + deviceName + "_" + date
	return result
}

func (s *SmartContract) GetAssetOwner(ctx contractapi.TransactionContextInterface, deviceName string, date string) (string, error) {
	assetID := CreateAssetID(deviceName, date)

	asetBytes, err := ctx.GetStub().GetState(assetID)
	if err != nil {
		return "", fmt.Errorf("error ocurred getting asset owner: %v", err)
	}
	var assetJSON DataAsset
	err = json.Unmarshal(asetBytes, &assetJSON)
	if err != nil {
		return "", fmt.Errorf("failed to unmarshal JSON: %v", err)
	}
	return assetJSON.OwnerOrg, nil
}

func (s *SmartContract) GetAllAssets(ctx contractapi.TransactionContextInterface) ([]interface{}, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")

	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var assets []interface{}
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		if strings.HasPrefix(queryResponse.Key, "data") {
			var dataAsset DataAsset
			err = json.Unmarshal(queryResponse.Value, &dataAsset)
			if err != nil {
				return nil, err
			}
			assets = append(assets, &dataAsset)
		} else if strings.HasPrefix(queryResponse.Key, "bid") {
			var bid DataBid
			err = json.Unmarshal(queryResponse.Value, &bid)
			if err != nil {
				return nil, err
			}
			assets = append(assets, &bid)
		}

	}
	return assets, nil
}

// GetAssetByID, assetID is: <assetName>_<date>,
func (s *SmartContract) GetAssetByID(ctx contractapi.TransactionContextInterface, assetId string) (*DataAsset, error) {
	assetId = "data_" + assetId
	assetBytes, err := ctx.GetStub().GetState(assetId)

	var assetJSON DataAsset
	json.Unmarshal(assetBytes, &assetJSON)
	if err != nil {
		return nil, fmt.Errorf("error ocurred getting asset JSON: %v", err)
	}
	return &assetJSON, nil
}

func (s *SmartContract) GetAllDataAssets(ctx contractapi.TransactionContextInterface) ([]*DataAsset, error) {
	startKey := "data"
	endKey := "data_~"
	resultsIterator, err := ctx.GetStub().GetStateByRange(startKey, endKey)

	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var assets []*DataAsset
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var asset DataAsset
		err = json.Unmarshal(queryResponse.Value, &asset)
		if err != nil {
			return nil, err
		}
		assets = append(assets, &asset)
	}

	return assets, nil
}

func (s *SmartContract) GetMyOrgsDataAssets(ctx contractapi.TransactionContextInterface) ([]*DataAsset, error) {
	mspid, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return nil, fmt.Errorf("error ocurred getting MSPID: %v", err)
	}

	startKey := "data"
	endKey := "data_~"
	resultsIterator, err := ctx.GetStub().GetStateByRange(startKey, endKey)

	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var assets []*DataAsset
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var asset DataAsset
		err = json.Unmarshal(queryResponse.Value, &asset)
		if err != nil {
			return nil, err
		}

		if asset.OwnerOrg == mspid {
			assets = append(assets, &asset)
		}
	}

	return assets, nil
}

func (s *SmartContract) GetOtherOrgsDataAssets(ctx contractapi.TransactionContextInterface) ([]*DataAsset, error) {
	mspid, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return nil, fmt.Errorf("error ocurred getting MSPID: %v", err)
	}

	startKey := "data"
	endKey := "data_~"
	resultsIterator, err := ctx.GetStub().GetStateByRange(startKey, endKey)

	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var assets []*DataAsset
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var asset DataAsset
		err = json.Unmarshal(queryResponse.Value, &asset)
		if err != nil {
			return nil, err
		}

		if asset.OwnerOrg != mspid {
			assets = append(assets, &asset)
		}
	}

	return assets, nil
}

func (s *SmartContract) UploadDataAsAsset(ctx contractapi.TransactionContextInterface, deviceName string, cid string, date string) error {
	id := CreateAssetID(deviceName, date)
	exists, err := s.AssetExists(ctx, id)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("the asset %s already exists", id)
	}

	mspid, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("error ocurred getting MSPID: %v", err)
	}

	asset := DataAsset{
		AssetName: deviceName,
		Date:      date,
		IPFS_CID:  cid,
		OwnerOrg:  mspid,
	}
	assetBytes, err := json.Marshal(asset)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(id, assetBytes)
}

func (s *SmartContract) UploadKeyPrivateData(ctx contractapi.TransactionContextInterface, deviceName string, IPFS_CID string, date string) error {
	mspid, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("error ocurred getting MSPID: %v", err)
	}
	privateCollectionName := "_implicit_org_" + mspid

	transientMap, err := ctx.GetStub().GetTransient()
	if err != nil {
		return fmt.Errorf("error getting transient: %v", err)
	}
	symmetricKeyBytes := transientMap["symmetricKey"]
	symmetricKey := string(symmetricKeyBytes)

	keyData := KeyCIDAsset{
		Date:         date,
		DeviceName:   deviceName,
		IPFS_CID:     IPFS_CID,
		SymmetricKey: symmetricKey,
	}
	jsonAsBytes, err := json.Marshal(keyData)
	assetKey := CreateAssetID(deviceName, date)
	if err != nil {
		return fmt.Errorf("error ocurred marshalling JSON to Byte array: %v", err)
	}
	return ctx.GetStub().PutPrivateData(privateCollectionName, assetKey, jsonAsBytes)
}

// Expects assetKey to be in format of <deviceName>_<date>
func (s *SmartContract) GetKeyPrivateData(ctx contractapi.TransactionContextInterface, assetKey string) (*KeyCIDAsset, error) {
	assetKey = "data_" + assetKey

	mspid, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return nil, fmt.Errorf("error ocurred getting MSPID: %v", err)
	}
	privateCollectionName := "_implicit_org_" + mspid

	privateData, err := ctx.GetStub().GetPrivateData(privateCollectionName, assetKey)
	if err != nil {
		return nil, fmt.Errorf("failed to read from implicit private collection: %v", err)
	}
	if privateData == nil {
		return nil, fmt.Errorf("data not found in implicit private collection")
	}

	var jsonData KeyCIDAsset
	err = json.Unmarshal(privateData, &jsonData)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal JSON: %v", err)
	}

	return &jsonData, nil
}

func (s *SmartContract) AssetExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	assetJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return assetJSON != nil, nil
}

/*
Model:
IoT data prefix:       data_<deviceName>_<date_
DataBid prefix :       bid_<deviceName>_<date>_<CurrentOwnerOrg>_<BiddingOrg>
BidApproval    :       bidApproval_<newOwnerOrg>_<oldOwnerOrg>_<deviceName>_<date>
*/

func (s *SmartContract) BidForData(ctx contractapi.TransactionContextInterface, deviceName string, date string, price string, additionalCommitments string) error {
	currentAssetOwner, err := s.GetAssetOwner(ctx, deviceName, date)
	if err != nil {
		return fmt.Errorf("failed to get Asset Owner %v", err)
	}
	biddingOrg, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get Client Identity %v", err)
	}

	bidID := "bid_" + deviceName + "_" + date + "_" + currentAssetOwner + "_" + biddingOrg

	bidData := DataBid{
		BiddingOrg:            biddingOrg,
		CurrentOwnerOrg:       currentAssetOwner,
		DeviceName:            deviceName,
		Date:                  date,
		Price:                 price,
		AdditionalCommitments: additionalCommitments,
		Active:                true,
	}

	bidDataBytes, err := json.Marshal(bidData)
	if err != nil {
		return fmt.Errorf("error ocurred marshalling JSON to Byte array: %v", err)
	}
	return ctx.GetStub().PutState(bidID, bidDataBytes)
}

func (s *SmartContract) InactivateAllBidsForThisData(ctx contractapi.TransactionContextInterface, currentOwnerOrg string, deviceName string, date string) error {
	startKey := "bid_" + deviceName + "_" + date + "_" + currentOwnerOrg
	endKey := "bid_" + deviceName + "_" + date + "_" + currentOwnerOrg + "_~"

	resultsIterator, err := ctx.GetStub().GetStateByRange(startKey, endKey)
	if err != nil {
		return err
	}
	defer resultsIterator.Close()

	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return err
		}

		var bid DataBid
		key := queryResponse.Key
		err = json.Unmarshal(queryResponse.Value, &bid)
		if err != nil {
			return fmt.Errorf("error unmarshalling query response into DataBid object: %v", err)
		}

		bid.Active = false
		updatedBidBytes, err := json.Marshal(bid)
		if err != nil {
			return fmt.Errorf("error marshaling bid into new object: %v", err)
		}

		ctx.GetStub().PutState(key, updatedBidBytes)
		if err != nil {
			return fmt.Errorf("error updating state for key: %v", key)
		}

	}
	return nil
}

func (s *SmartContract) GetBidsForMyOrg(ctx contractapi.TransactionContextInterface) ([]*DataBid, error) {
	mspid, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return nil, fmt.Errorf("error ocurred getting MSPID: %v", err)
	}

	startKey := "bid_"
	endKey := "bid_~"

	resultsIterator, err := ctx.GetStub().GetStateByRange(startKey, endKey)
	if err != nil {
		return nil, fmt.Errorf("error ocurred getting iterator: %v", err)
	}
	defer resultsIterator.Close()

	var bids []*DataBid
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		var bid DataBid
		err = json.Unmarshal(queryResponse.Value, &bid)
		if err != nil {
			return nil, err
		}

		if bid.CurrentOwnerOrg == mspid && bid.Active == true {
			bids = append(bids, &bid)
		}
	}
	return bids, nil
}

// DataBid prefix: bid_<deviceName>_<date>_<CurrentOwnerOrg>_<BiddingOrg>
func (s *SmartContract) AcceptBid(ctx contractapi.TransactionContextInterface, biddingOrg string, deviceName string, date string, price string) error {
	clientMspid, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("error ocurred getting MSPID: %v", err)
	}
	bidID := "bid_" + deviceName + "_" + date + "_" + clientMspid + "_" + biddingOrg
	bidBytes, err := ctx.GetStub().GetState(bidID)
	if err != nil {
		return fmt.Errorf("error ocurred getting bid to accept: %v", err)
	}

	var bidJSON DataBid
	err = json.Unmarshal(bidBytes, &bidJSON)
	if err != nil || biddingOrg != bidJSON.BiddingOrg || clientMspid != bidJSON.CurrentOwnerOrg || price != bidJSON.Price || !bidJSON.Active {
		return fmt.Errorf("error ocurred processing bid. mismatch between provided bid details, and bid recorded on ledger")
	}
	s.InactivateAllBidsForThisData(ctx, clientMspid, deviceName, date)

	assetID := CreateAssetID(deviceName, date)
	asetBytes, err := ctx.GetStub().GetState(assetID)
	if err != nil {
		return fmt.Errorf("error ocurred getting asset owner: %v", err)
	}
	var assetJSON DataAsset
	err = json.Unmarshal(asetBytes, &assetJSON)
	if err != nil {
		return fmt.Errorf("failed to unmarshal JSON: %v", err)
	}

	assetJSON.OwnerOrg = biddingOrg
	updatedAssetBytes, err := json.Marshal(assetJSON)
	if err != nil {
		return fmt.Errorf("failed to marhsal new Asset to JSON: %v", err)
	}
	err = ctx.GetStub().PutState(assetID, updatedAssetBytes)
	if err != nil {
		return fmt.Errorf("failed to put updated asset with new owner to the ledger: %v", err)
	}

	bidApprovalEvent := BidApproval{
		Date: date, DeviceName: deviceName, NewOwnerOrg: biddingOrg, OriginalOwnerOrg: clientMspid,
	}
	bidApprovalEventJSON, err := json.Marshal(bidApprovalEvent)
	if err != nil {
		return fmt.Errorf("failed to marshal bidApprovalEvent to json: %v", err)
	}

	// bidApproval_<newOwnerOrg>_<oldOwnerOrg>_<deviceName>_<date>
	bidApprovalId := "bidApproval_" + biddingOrg + "_" + clientMspid + "_" + deviceName + "_" + date
	ctx.GetStub().SetEvent(bidApprovalId, bidApprovalEventJSON)

	return nil
}

func (s *SmartContract) TransferEncKey(ctx contractapi.TransactionContextInterface, newOwnerOrg string, deviceName string, date string) error {
	newOwnerCollectionName := "_implicit_org_" + newOwnerOrg
	keyId := CreateAssetID(deviceName, date)
	asset, err := s.GetAssetByID(ctx, deviceName+"_"+date)
	if err != nil {
		return fmt.Errorf("error getting asset by ID: %v", err)
	}

	transientMap, err := ctx.GetStub().GetTransient()
	if err != nil {
		return fmt.Errorf("error getting transient: %v", err)
	}
	symmetricKeyBytes := transientMap["symmetricKey"]
	symmetricKey := string(symmetricKeyBytes)

	keyData := KeyCIDAsset{
		Date:         date,
		DeviceName:   deviceName,
		IPFS_CID:     asset.IPFS_CID,
		SymmetricKey: symmetricKey,
	}
	jsonAsBytes, err := json.Marshal(keyData)
	ctx.GetStub().PutPrivateData(newOwnerCollectionName, keyId, jsonAsBytes)
	if err != nil {
		return fmt.Errorf("error putting private data into new owners implicit collection: %v", err)
	}

	// //Lines below were commented as we don't want to delete the private key for the old owner org.
	// clientMspid, err := ctx.GetClientIdentity().GetMSPID()
	// if err != nil {
	// 	return fmt.Errorf("failed to get mspid of client that invoked this transaction")
	// }

	// oldOwnerCollectionName := "_implicit_org_" + clientMspid
	// ctx.GetStub().DelPrivateData(oldOwnerCollectionName, keyId)

	return nil
}

func main() {
	assetChaincode, err := contractapi.NewChaincode(&SmartContract{})
	if err != nil {
		log.Panicf("Error creating IPFS Asset manager chaincode: %v", err)
	}

	if err := assetChaincode.Start(); err != nil {
		log.Panicf("Error starting IPFS Asset manager chaincode: %v", err)
	}

}
