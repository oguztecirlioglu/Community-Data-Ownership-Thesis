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

type DataTransaction struct {
	TransactionType string `json:"transactionType"`
	IssuingOrg      string `json:"IssuingOrg"`
}

type DataBid struct {
	BiddingOrg      string `json:"biddingOrg"`
	CurrentOwnerOrg string `json:"currentOwnerOrg"`
	DeviceName      string `json:"deviceName"`
	Date            string `json:"date"`
	Price           string `json:"price"`
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
		} else if strings.HasPrefix(queryResponse.Key, "transaction") {
			var transaction DataTransaction
			err = json.Unmarshal(queryResponse.Value, &transaction)
			if err != nil {
				return nil, err
			}
			assets = append(assets, &transaction)
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

func (s *SmartContract) UploadKeyPrivateData(ctx contractapi.TransactionContextInterface, deviceName string, IPFS_CID string, date string, symmetricKey string) error {
	mspid, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("error ocurred getting MSPID: %v", err)
	}
	privateCollectionName := "_implicit_org_" + mspid

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
IoT data prefix:  data_
DataBid prefix:       bid_<deviceName>_<date>_<CurrentOwnerOrg>_<BidderOrg>
Data Transfer:    dataTransfer_
*/

func (s *SmartContract) BidForData(ctx contractapi.TransactionContextInterface, deviceName string, date string, price string) error {
	currentAssetOwner, err := s.GetAssetOwner(ctx, deviceName, date)
	if err != nil {
		return fmt.Errorf("failed to get Asset Owner %v", err)
	}
	bidderOrg, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get Client Identity %v", err)
	}

	bidID := "bid_" + deviceName + "_" + date + "_" + currentAssetOwner + "_" + bidderOrg

	bidData := DataBid{
		BiddingOrg:      bidderOrg,
		CurrentOwnerOrg: currentAssetOwner,
		DeviceName:      deviceName,
		Date:            date,
		Price:           price,
	}

	bidDataBytes, err := json.Marshal(bidData)
	if err != nil {
		return fmt.Errorf("error ocurred marshalling JSON to Byte array: %v", err)
	}
	return ctx.GetStub().PutState(bidID, bidDataBytes)
}

func (s *SmartContract) DeleteAllBidsForThisData(ctx contractapi.TransactionContextInterface, currentOwnerOrg string, deviceName string, date string) error {
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
		key := queryResponse.Key
		err = ctx.GetStub().DelState(key)
		if err != nil {
			return fmt.Errorf("Error deleting state for key: %v", key)
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

		if bid.CurrentOwnerOrg == mspid {
			bids = append(bids, &bid)
		}
	}
	return bids, nil
}

func (s *SmartContract) AcceptBid(ctx contractapi.TransactionContextInterface, bidderOrg string, deviceName string, date string, price string) error {
	// make sure the bid i want to accept exists
	// identify new owner
	// delete all bids
	// update asset, change OwnerOrg field to new owner.
	mspid, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("error ocurred getting MSPID: %v", err)
	}
	bidID := "bid_" + deviceName + "_" + date + "_" + mspid + "_" + bidderOrg
	bidBytes, err := ctx.GetStub().GetState(bidID)
	if err != nil {
		return fmt.Errorf("error ocurred getting bid to accept: %v", err)
	}
	var bidJSON DataBid
	err = json.Unmarshal(bidBytes, &bidJSON)

	if bidderOrg != bidJSON.BiddingOrg || mspid != bidJSON.CurrentOwnerOrg || price != bidJSON.Price {
		return fmt.Errorf("error ocurred processing bid. mismatch between provided bid details, and bid recorded on ledger")
	}
	s.DeleteAllBidsForThisData(ctx, mspid, deviceName, date)

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

	assetJSON.OwnerOrg = bidderOrg

	_, err = json.Marshal(assetJSON)
	if err != nil {
		return fmt.Errorf("failed to marhsal new Asset to JSON: %v", err)
	}

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
