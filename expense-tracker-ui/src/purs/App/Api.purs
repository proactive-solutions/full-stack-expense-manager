module App.Api
  ( fetchExpenses
  , fetchExpense
  , createExpense
  , updateExpense
  , deleteExpense
  , fetchSummary
  , fetchSummaryByCategory
  ) where

import Prelude

import App.Types (Expense, ExpenseCreate, ExpenseUpdate, ExpenseListResponse(..), SummaryResponse(..), CategorySummary(..))
import Affjax.Web (get, post, put, delete_) as AJ
import Affjax.ResponseFormat as RF
import Affjax (printError)
import Affjax.RequestBody as RB
import Data.Argonaut.Encode.Class (encodeJson)
import Data.Argonaut.Decode.Class (decodeJson)
import Data.Argonaut.Decode.Error (JsonDecodeError)
import Data.Either (Either(..))
import Data.Bifunctor (lmap)
import Data.Maybe (Maybe(..))
import Effect.Aff (Aff)

showDecodeError :: JsonDecodeError -> String
showDecodeError err = show err

baseUrl :: String
baseUrl = "http://127.0.0.1:8000"

fetchExpenses :: Aff (Either String ExpenseListResponse)
fetchExpenses = do
  result <- AJ.get RF.json (baseUrl <> "/expenses")
  pure $ case result of
    Left err -> Left (printError err)
    Right response -> lmap showDecodeError (decodeJson response.body)

fetchExpense :: Int -> Aff (Either String Expense)
fetchExpense id = do
  result <- AJ.get RF.json (baseUrl <> "/expenses/" <> show id)
  pure $ case result of
    Left err -> Left (printError err)
    Right response -> lmap showDecodeError (decodeJson response.body)

createExpense :: ExpenseCreate -> Aff (Either String Expense)
createExpense expense = do
  result <- AJ.post RF.json (baseUrl <> "/expenses") (Just (RB.json (encodeJson expense)))
  pure $ case result of
    Left err -> Left (printError err)
    Right response -> lmap showDecodeError (decodeJson response.body)

updateExpense :: Int -> ExpenseUpdate -> Aff (Either String Expense)
updateExpense id expense = do
  result <- AJ.put RF.json (baseUrl <> "/expenses/" <> show id) (Just (RB.json (encodeJson expense)))
  pure $ case result of
    Left err -> Left (printError err)
    Right response -> lmap showDecodeError (decodeJson response.body)

deleteExpense :: Int -> Aff (Either String Unit)
deleteExpense id = do
  result <- AJ.delete_ (baseUrl <> "/expenses/" <> show id)
  pure $ case result of
    Left err -> Left (printError err)
    Right _ -> Right unit

fetchSummary :: Aff (Either String SummaryResponse)
fetchSummary = do
  result <- AJ.get RF.json (baseUrl <> "/summary")
  pure $ case result of
    Left err -> Left (printError err)
    Right response -> lmap showDecodeError (decodeJson response.body)

fetchSummaryByCategory :: Aff (Either String (Array CategorySummary))
fetchSummaryByCategory = do
  result <- AJ.get RF.json (baseUrl <> "/summary/by-category")
  pure $ case result of
    Left err -> Left (printError err)
    Right response -> lmap showDecodeError (decodeJson response.body)
