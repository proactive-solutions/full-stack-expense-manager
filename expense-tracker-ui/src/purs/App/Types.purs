module App.Types
  ( Expense(..)
  , ExpenseCreate
  , ExpenseUpdate
  , ExpenseListResponse(..)
  , SummaryResponse(..)
  , CategorySummary(..)
  , Category(..)
  , categoryToString
  , stringToCategory
  , allCategories
  ) where

import Prelude

import Data.Argonaut.Decode.Class (class DecodeJson, decodeJson)
import Data.Argonaut.Decode.Combinators ((.:))
import Data.Argonaut.Encode.Class (class EncodeJson, encodeJson)
import Data.Argonaut.Encode.Combinators ((:=), (~>))
import Data.Argonaut.Core (jsonEmptyObject)
import Data.Either (Either)
import Data.Bounded (class Bounded, bottom, top)
import Data.Enum (class Enum, succ, pred, enumFromTo)
import Data.Maybe (Maybe(..))

data Category
  = Food
  | Transport
  | Entertainment
  | Utilities
  | Healthcare
  | Education
  | Shopping
  | Other

derive instance eqCategory :: Eq Category
derive instance ordCategory :: Ord Category

instance showCategory :: Show Category where
  show Food = "food"
  show Transport = "transport"
  show Entertainment = "entertainment"
  show Utilities = "utilities"
  show Healthcare = "healthcare"
  show Education = "education"
  show Shopping = "shopping"
  show Other = "other"

instance boundedCategory :: Bounded Category where
  bottom = Food
  top = Other

instance enumCategory :: Enum Category where
  succ Food = Just Transport
  succ Transport = Just Entertainment
  succ Entertainment = Just Utilities
  succ Utilities = Just Healthcare
  succ Healthcare = Just Education
  succ Education = Just Shopping
  succ Shopping = Just Other
  succ Other = Nothing
  pred Transport = Just Food
  pred Entertainment = Just Transport
  pred Utilities = Just Entertainment
  pred Healthcare = Just Utilities
  pred Education = Just Healthcare
  pred Shopping = Just Education
  pred Other = Just Shopping
  pred Food = Nothing

categoryToString :: Category -> String
categoryToString = show

stringToCategory :: String -> Maybe Category
stringToCategory "food" = Just Food
stringToCategory "transport" = Just Transport
stringToCategory "entertainment" = Just Entertainment
stringToCategory "utilities" = Just Utilities
stringToCategory "healthcare" = Just Healthcare
stringToCategory "education" = Just Education
stringToCategory "shopping" = Just Shopping
stringToCategory "other" = Just Other
stringToCategory _ = Nothing

allCategories :: Array Category
allCategories = enumFromTo bottom top

type ExpenseCreate =
  { title :: String
  , description :: String
  , amount :: Number
  , category :: String
  }

type ExpenseUpdate =
  { title :: Maybe String
  , description :: Maybe String
  , amount :: Maybe Number
  , category :: Maybe String
  }

type Expense =
  { id :: Int
  , title :: String
  , description :: String
  , amount :: Number
  , category :: String
  , createdAt :: String
  , updatedAt :: String
  }

newtype ExpenseListResponse = ExpenseListResponse
  { expenses :: Array Expense
  , total :: Int
  }

instance decodeExpenseListResponse :: DecodeJson ExpenseListResponse where
  decodeJson json = do
    obj <- decodeJson json
    expenses <- obj .: "expenses"
    total <- obj .: "total"
    pure $ ExpenseListResponse { expenses, total }

newtype SummaryResponse = SummaryResponse
  { totalAmount :: Number
  , totalCount :: Int
  }

instance decodeSummaryResponse :: DecodeJson SummaryResponse where
  decodeJson json = do
    obj <- decodeJson json
    totalAmount <- obj .: "total_amount"
    totalCount <- obj .: "total_count"
    pure $ SummaryResponse { totalAmount, totalCount }

newtype CategorySummary = CategorySummary
  { category :: String
  , total :: Number
  , count :: Int
  }

instance decodeCategorySummary :: DecodeJson CategorySummary where
  decodeJson json = do
    obj <- decodeJson json
    category <- obj .: "category"
    total <- obj .: "total"
    count <- obj .: "count"
    pure $ CategorySummary { category, total, count }
