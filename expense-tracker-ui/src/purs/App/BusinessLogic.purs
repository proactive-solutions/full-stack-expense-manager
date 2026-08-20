module App.BusinessLogic
  ( formatCurrency
  , formatDate
  , filterExpensesByCategory
  , searchExpenses
  , calculateTotal
  , categorizeExpenses
  , getExpenseStats
  , ExpenseStats
  ) where

import Prelude

import App.Types (Expense)
import Data.Array (filter, head, length, sortBy, null)
import Data.Function (on)
import Data.Foldable (sum)
import Data.Int (toNumber, floor)
import Data.Maybe (Maybe(..))
import Data.String (toLower, contains, Pattern(..))
import Data.Tuple (Tuple(..))
import Data.Number (round)

formatCurrency :: Number -> String
formatCurrency amount = "$" <> showFixed amount
  where
  showFixed :: Number -> String
  showFixed n = 
    let intPart = floor n
        fracPart = round ((n - toNumber intPart) * 100.0)
    in show intPart <> "." <> if fracPart < 10.0 then "0" <> show fracPart else show fracPart

formatDate :: String -> String
formatDate dateStr = 
  case dateStr of
    "" -> "N/A"
    d -> d

filterExpensesByCategory :: Array Expense -> String -> Array Expense
filterExpensesByCategory expenses category = 
  if category == "all" || category == ""
    then expenses
    else filter (\e -> toLower e.category == toLower category) expenses

searchExpenses :: Array Expense -> String -> Array Expense
searchExpenses expenses query = 
  if query == ""
    then expenses
    else filter (\e -> contains (Pattern (toLower query)) (toLower e.title) || contains (Pattern (toLower query)) (toLower e.description)) expenses

calculateTotal :: Array Expense -> Number
calculateTotal expenses = sum (map _.amount expenses)

categorizeExpenses :: Array Expense -> Array (Tuple String (Array Expense))
categorizeExpenses expenses = 
  let sorted = sortBy (compare `on` _.category) expenses
  in go sorted
  where
  go arr = case head arr of
    Nothing -> []
    Just first -> 
      let cat = first.category
          sameCat = filter (\e -> e.category == cat) arr
          rest = filter (\e -> e.category /= cat) arr
      in [Tuple cat sameCat] <> go rest

type ExpenseStats =
  { totalAmount :: Number
  , totalCount :: Int
  , averageAmount :: Number
  , highestExpense :: Maybe Expense
  , lowestExpense :: Maybe Expense
  }

getExpenseStats :: Array Expense -> ExpenseStats
getExpenseStats expenses = 
  { totalAmount: calculateTotal expenses
  , totalCount: length expenses
  , averageAmount: if length expenses == 0 then 0.0 else calculateTotal expenses / toNumber (length expenses)
  , highestExpense: if null expenses then Nothing else head (sortBy (flip compare `on` _.amount) expenses)
  , lowestExpense: if null expenses then Nothing else head (sortBy (compare `on` _.amount) expenses)
  }
