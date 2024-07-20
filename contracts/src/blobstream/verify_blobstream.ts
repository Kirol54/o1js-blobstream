import {
    Field,
    PrivateKey,
    Provable,
    SmartContract,
    State,
    VerificationKey,
    method,
    state,
    Poseidon,
    UInt8,
    Bytes,
    Gadgets,
    ZkProgram,
    Struct,
    UInt64,
    Undefined,
  } from 'o1js';
import { FrC } from '../towers/index.js';
import { NodeProofLeft } from '../structs.js';
import { parsePublicInputs, parsePublicInputsProvable } from '../plonk/parse_pi.js';
import { provableBn254ScalarFieldToBytes, wordToBytes } from '../sha/utils.js';
import fs from 'fs';

const blobstreamProgramVk: FrC = FrC.from("0x744021aed5b2c14ea2052e2570261bc1d16dbad1188f6c3833735f62dc1b82")
const blobstreamNodeVk: Field = Field.from(20197230879339549708088630386158007275561315945478767330700301953454441177956n);
const vk = VerificationKey.fromJSON(JSON.parse(fs.readFileSync('./src/plonk/recursion/vks/nodeVk.json', 'utf8')))

class Bytes32 extends Bytes(32) {}

class BlobstreamInput extends Struct({
    trustedHeaderHash: Bytes32.provable,
    targetHeaderHash: Bytes32.provable,
    dataCommitment: Bytes32.provable,
    trustedBlockHeight: UInt64,
    targetBlockHeight: UInt64,
    validatorBitmap: Bytes32.provable,
}) {}

const padUInt64To32Bytes = (num: UInt64): UInt8[] => {
    const unpadded = wordToBytes(num.toFields()[0])
    return [
        ...unpadded,
        ...Array(24).fill(UInt8.from(0)),
    ].reverse();
}

const blobstreamVerifier = ZkProgram({
    name: 'blobstreamVerifier',
    publicInput: BlobstreamInput,
    publicOutput: Undefined,
    methods: {
      compute: {
        privateInputs: [NodeProofLeft],
        async method(
            input: BlobstreamInput,
            proof: NodeProofLeft,
        ) {
            proof.verify(vk)
            proof.publicOutput.subtreeVkDigest.assertEquals(blobstreamNodeVk)


            let bytes: UInt8[] = []; 
            bytes = bytes.concat(input.trustedHeaderHash.bytes);    
            bytes = bytes.concat(input.targetHeaderHash.bytes);    
            bytes = bytes.concat(input.dataCommitment.bytes);    
            bytes = bytes.concat(padUInt64To32Bytes(input.trustedBlockHeight));    
            bytes = bytes.concat(padUInt64To32Bytes(input.targetBlockHeight));    
            bytes = bytes.concat(input.validatorBitmap.bytes);    
           
            const pi0 = blobstreamProgramVk;
            const pi1 = parsePublicInputsProvable(Bytes.from(bytes));
            
            const piDigest = Poseidon.hashPacked(Provable.Array(FrC.provable, 2), [pi0, pi1])
            piDigest.assertEquals(proof.publicOutput.rightOut)

            return undefined;
        },
      },
    },
});

const BlobstreamProof = ZkProgram.Proof(blobstreamVerifier);
export { blobstreamVerifier, BlobstreamProof, BlobstreamInput, Bytes32 };