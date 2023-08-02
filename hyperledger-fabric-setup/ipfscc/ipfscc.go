	package main

	import (
		"encoding/json"
		"fmt"
		"log"

		"github.com/hyperledger/fabric-contract-api-go/contractapi"
	)

	// SmartContract provides functions for managing an Asset
	type SmartContract struct {
		contractapi.Contract
	}

	type DataAsset struct {
		AssetName    string `json:"assetName"`
		Date         string `json:"date"`
		IPFS_CID     string `json:"IPFS_CID"`
		UploadingOrg string `json:"uploadingOrg"`
	}

	type KeyCIDAsset struct {
		Date         string `json:"date"`
		DeviceName   string `json:"deviceName"`
		IPFS_CID     string `json:"IPFS_CID"`
		SymmetricKey string `json:"symmetricKey"`
	}

	// GetAllAssets returns all assets found in world state, marshalling them into a DataAsset struct.
	func (s *SmartContract) GetAllAssets(ctx contractapi.TransactionContextInterface) ([]*DataAsset, error) {
		resultsIterator, err := ctx.GetStub().GetStateByRange("", "")

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

	func (s *SmartContract) GetMyOrgsAssets(ctx contractapi.TransactionContextInterface) ([]*DataAsset, error) {
		mspid, err := ctx.GetClientIdentity().GetMSPID()
		if err != nil {
			return nil, fmt.Errorf("error ocurred getting MSPID: %v", err)
		}

		resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
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

			if asset.UploadingOrg == mspid {
				assets = append(assets, &asset)
			}
		}

		return assets, nil

	}

	func (s *SmartContract) GetAssetByID(ctx contractapi.TransactionContextInterface, id string) (*DataAsset, error) {
		assetJSON, err := ctx.GetStub().GetState(id)
		if err != nil {
			return nil, err
		}
		if assetJSON == nil {
			return nil, fmt.Errorf("the asset %s does not exist", id)
		}

		var asset DataAsset
		err = json.Unmarshal(assetJSON, &asset)
		if err != nil {
			return nil, err
		}

		return &asset, nil
	}

	func (s *SmartContract) UploadDataAsAsset(ctx contractapi.TransactionContextInterface, deviceName string, cid string, date string) error {
		id := deviceName + "_" + date
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
			AssetName:    deviceName,
			Date:         date,
			IPFS_CID:     cid,
			UploadingOrg: mspid,
		}
		assetJSON, err := json.Marshal(asset)
		if err != nil {
			return err
		}

		return ctx.GetStub().PutState(id, assetJSON)
	}

	func (s *SmartContract) AssetExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
		assetJSON, err := ctx.GetStub().GetState(id)
		if err != nil {
			return false, fmt.Errorf("failed to read from world state: %v", err)
		}

		return assetJSON != nil, nil
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
		assetKey := deviceName + "_" + date

		if err != nil {
			return fmt.Errorf("error ocurred marshalling JSON to Byte array: %v", err)
		}
		return ctx.GetStub().PutPrivateData(privateCollectionName, assetKey, jsonAsBytes)
	}

	func (s *SmartContract) GetKeyPrivateData(ctx contractapi.TransactionContextInterface, assetKey string) (*KeyCIDAsset, error) {
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

	func main() {
		assetChaincode, err := contractapi.NewChaincode(&SmartContract{})
		if err != nil {
			log.Panicf("Error creating IPFS Asset manager chaincode: %v", err)
		}

		if err := assetChaincode.Start(); err != nil {
			log.Panicf("Error starting IPFS Asset manager chaincode: %v", err)
		}

	}
