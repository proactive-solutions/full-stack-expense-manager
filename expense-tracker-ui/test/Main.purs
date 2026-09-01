module Test.Main where

import Prelude

import App.BusinessLogic
  ( formatCurrency
  , formatDate
  , filterExpensesByCategory
  , searchExpenses
  , calculateTotal
  , categorizeExpenses
  , getExpenseStats
  )
import App.Types (Category(..), categoryToString, stringToCategory, allCategories)
import Data.Array (length) as Array
import Data.Maybe (Maybe(..), isJust, isNothing)
import Data.Tuple (Tuple(..))
import Effect (Effect)
import Effect.Aff (launchAff_)
import Test.Spec (describe, it)
import Test.Spec.Assertions (shouldEqual, shouldSatisfy)
import Test.Spec.Reporter.Console (consoleReporter)
import Test.Spec.Runner (runSpec)

type Expense =
  { id :: Int
  , title :: String
  , description :: String
  , amount :: Number
  , category :: String
  , createdAt :: String
  , updatedAt :: String
  }

sampleExpenses :: Array Expense
sampleExpenses =
  [ { id: 1, title: "Groceries", description: "Weekly shopping", amount: 50.0, category: "food", createdAt: "2024-01-01", updatedAt: "2024-01-01" }
  , { id: 2, title: "Bus ticket", description: "Commute", amount: 2.5, category: "transport", createdAt: "2024-01-02", updatedAt: "2024-01-02" }
  , { id: 3, title: "Movie", description: "Cinema", amount: 15.0, category: "entertainment", createdAt: "2024-01-03", updatedAt: "2024-01-03" }
  , { id: 4, title: "Lunch", description: "Food again", amount: 12.75, category: "food", createdAt: "2024-01-04", updatedAt: "2024-01-04" }
  ]

main :: Effect Unit
main = launchAff_ $ runSpec [ consoleReporter ] do
  describe "App.BusinessLogic" do
    describe "formatCurrency" do
      it "formats whole numbers" do
        formatCurrency 10.0 `shouldEqual` "$10.00"
      it "formats fractional" do
        formatCurrency 12.5 `shouldEqual` "$12.50"
      it "formats small fraction with leading zero" do
        formatCurrency 2.05 `shouldEqual` "$2.05"
      it "formats zero" do
        formatCurrency 0.0 `shouldEqual` "$0.00"

    describe "formatDate" do
      it "returns N/A for empty string" do
        formatDate "" `shouldEqual` "N/A"
      it "returns same string otherwise" do
        formatDate "2024-01-01" `shouldEqual` "2024-01-01"

    describe "filterExpensesByCategory" do
      it "returns all for 'all'" do
        Array.length (filterExpensesByCategory sampleExpenses "all") `shouldEqual` 4
      it "returns all for empty string" do
        Array.length (filterExpensesByCategory sampleExpenses "") `shouldEqual` 4
      it "filters case-insensitive" do
        Array.length (filterExpensesByCategory sampleExpenses "FOOD") `shouldEqual` 2
      it "filters single category" do
        Array.length (filterExpensesByCategory sampleExpenses "transport") `shouldEqual` 1

    describe "searchExpenses" do
      it "returns all for empty query" do
        Array.length (searchExpenses sampleExpenses "") `shouldEqual` 4
      it "matches title case-insensitive" do
        Array.length (searchExpenses sampleExpenses "groceries") `shouldEqual` 1
      it "matches description" do
        Array.length (searchExpenses sampleExpenses "cinema") `shouldEqual` 1
      it "returns empty for no match" do
        Array.length (searchExpenses sampleExpenses "xyz") `shouldEqual` 0

    describe "calculateTotal" do
      it "sums amounts" do
        calculateTotal sampleExpenses `shouldEqual` 80.25
      it "returns 0 for empty" do
        calculateTotal [] `shouldEqual` 0.0

    describe "categorizeExpenses" do
      it "groups by category" do
        let cats = categorizeExpenses sampleExpenses
        Array.length cats `shouldEqual` 3
      it "empty array returns empty" do
        categorizeExpenses [] `shouldEqual` []

    describe "getExpenseStats" do
      it "computes totalCount and totalAmount" do
        let stats = getExpenseStats sampleExpenses
        stats.totalCount `shouldEqual` 4
        stats.totalAmount `shouldEqual` 80.25
        stats.averageAmount `shouldEqual` 20.0625
      it "handles empty" do
        let stats = getExpenseStats []
        stats.totalCount `shouldEqual` 0
        stats.totalAmount `shouldEqual` 0.0
        stats.highestExpense `shouldSatisfy` isNothing
        stats.lowestExpense `shouldSatisfy` isNothing
      it "finds highest/lowest" do
        let stats = getExpenseStats sampleExpenses
        stats.highestExpense `shouldSatisfy` isJust
        stats.lowestExpense `shouldSatisfy` isJust

  describe "App.Types" do
    describe "categoryToString" do
      it "Food -> food" do
        categoryToString Food `shouldEqual` "food"
      it "Other -> other" do
        categoryToString Other `shouldEqual` "other"
    describe "stringToCategory" do
      it "parses food" do
        stringToCategory "food" `shouldEqual` Just Food
      it "returns Nothing for invalid" do
        stringToCategory "invalid" `shouldEqual` Nothing
    describe "allCategories" do
      it "has 8 categories" do
        Array.length allCategories `shouldEqual` 8
