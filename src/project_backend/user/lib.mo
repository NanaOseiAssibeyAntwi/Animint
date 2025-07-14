import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Map "mo:base/HashMap";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";

module UserModule {
  public type User = {
    principal: Principal;
    registeredAt: Int;
    isVerified: Bool;
    balance: Nat;
  };

  let INITIAL_TOKENS: Nat = 10_000; // Enough for 1-2 NFTs
  let NFT_COST: Nat = 5_000;
  let TOPUP_AMOUNT: Nat = 10_000;

  public class Registry() {
    private var users = Map.HashMap<Principal, User>(0, Principal.equal, Principal.hash);

    public func registerUser(principal: Principal, now: Int) : Result.Result<(), Text> {
      switch (users.get(principal)) {
        case (?_) { return #err("User already registered"); };
        case null {
          let user: User = {
            principal = principal;
            registeredAt = now;
            isVerified = false;
            balance = INITIAL_TOKENS;
          };
          users.put(principal, user);
          #ok(())
        }
      }
    };

    public func verifyUser(principal: Principal) : Result.Result<(), Text> {
      switch (users.get(principal)) {
        case null { return #err("User not found"); };
        case (?user) {
          users.put(principal, { user with isVerified = true });
          #ok(())
        }
      }
    };

    public func isUserRegistered(principal: Principal) : Bool {
      users.get(principal) != null
    };

    public func isUserVerified(principal: Principal) : Bool {
      switch (users.get(principal)) {
        case (?user) { user.isVerified };
        case null { false };
      }
    };

    public func getUser(principal: Principal) : ?User {
      users.get(principal)
    };

    public func allUsers() : [User] {
      Iter.toArray(users.vals())
    };

    public func getBalance(principal: Principal) : Nat {
      switch (users.get(principal)) {
        case (?user) { user.balance };
        case null { 0 };
      }
    };

    public func topUp(principal: Principal) : Result.Result<Nat, Text> {
      switch (users.get(principal)) {
        case null { return #err("User not found"); };
        case (?user) {
          let newBal = user.balance + TOPUP_AMOUNT;
          users.put(principal, { user with balance = newBal });
          #ok(newBal)
        }
      }
    };

    public func chargeForNFT(principal: Principal) : Result.Result<Nat, Text> {
      switch (users.get(principal)) {
        case null { return #err("User not found"); };
        case (?user) {
          if (user.balance < NFT_COST) {
            return #err("Insufficient balance");
          };
          let newBal = Nat.sub(user.balance, NFT_COST);
          users.put(principal, { user with balance = newBal });
          #ok(newBal)
        }
      }
    };
  }
}
