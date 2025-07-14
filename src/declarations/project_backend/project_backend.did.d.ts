import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Animal {
  'id' : AnimalId,
  'dam' : [] | [AnimalId],
  'birthDate' : bigint,
  'owner' : Principal,
  'dnaHash' : [] | [DNAHash],
  'name' : string,
  'sire' : [] | [AnimalId],
  'isVerified' : boolean,
  'microchipId' : MicrochipId,
  'breed' : string,
  'species' : string,
  'breeder' : Principal,
}
export type AnimalId = string;
export interface BreedNFT {
  'id' : bigint,
  'owner' : Principal,
  'imageUrl' : string,
  'breed' : string,
}
export interface BreederStats {
  'reputationScore' : bigint,
  'totalAnimals' : bigint,
  'verifiedAnimals' : bigint,
  'breeder' : Principal,
}
export type DNAHash = string;
export interface Litter {
  'id' : string,
  'dam' : AnimalId,
  'birthDate' : bigint,
  'sire' : AnimalId,
  'offspring' : Array<AnimalId>,
  'breeder' : Principal,
}
export type MicrochipId = string;
export type Result = { 'ok' : null } |
  { 'err' : string };
export type Result_1 = { 'ok' : string } |
  { 'err' : string };
export type Result_2 = { 'ok' : AnimalId } |
  { 'err' : string };
export type Result_3 = { 'ok' : bigint } |
  { 'err' : string };
export interface User {
  'principal' : Principal,
  'balance' : bigint,
  'isVerified' : boolean,
  'registeredAt' : bigint,
}
export interface _SERVICE {
  'getAllAnimals' : ActorMethod<[], Array<Animal>>,
  'getAllBreedNFTs' : ActorMethod<[], Array<BreedNFT>>,
  'getAllUsers' : ActorMethod<[], Array<User>>,
  'getAnimal' : ActorMethod<[AnimalId], [] | [Animal]>,
  'getAnimalsByBreeder' : ActorMethod<[Principal], Array<Animal>>,
  'getAnimalsByOwner' : ActorMethod<[Principal], Array<Animal>>,
  'getBalance' : ActorMethod<[Principal], bigint>,
  'getBreedNFTsByOwner' : ActorMethod<[Principal], Array<BreedNFT>>,
  'getBreederStats' : ActorMethod<[Principal], [] | [BreederStats]>,
  'getLineage' : ActorMethod<[AnimalId], Array<Animal>>,
  'getLitter' : ActorMethod<[string], [] | [Litter]>,
  'getStats' : ActorMethod<
    [],
    {
      'totalAnimals' : bigint,
      'totalLitters' : bigint,
      'totalBreeders' : bigint,
      'verifiedAnimals' : bigint,
    }
  >,
  'getUser' : ActorMethod<[Principal], [] | [User]>,
  'isUserRegistered' : ActorMethod<[Principal], boolean>,
  'isUserVerified' : ActorMethod<[Principal], boolean>,
  'mintBreedNFT' : ActorMethod<[string], Result_3>,
  'registerAnimal' : ActorMethod<
    [
      MicrochipId,
      string,
      string,
      string,
      [] | [AnimalId],
      [] | [AnimalId],
      [] | [DNAHash],
    ],
    Result_2
  >,
  'registerLitter' : ActorMethod<
    [AnimalId, AnimalId, Array<AnimalId>],
    Result_1
  >,
  'registerUser' : ActorMethod<[], Result>,
  'transferOwnership' : ActorMethod<[AnimalId, Principal], Result>,
  'verifyAnimal' : ActorMethod<[AnimalId], Result>,
  'verifyMicrochip' : ActorMethod<[MicrochipId], [] | [AnimalId]>,
  'verifyUser' : ActorMethod<[], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
