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
import { blob } from 'stream/consumers';
import { Bytes32 } from './verify_blobstream.js';

const blobInclusionProgramVk: FrC = FrC.from(process.env.BLOB_INCLUSION_PROGRAM_VK as string)
const workDir = process.env.BLOB_INCLUSION_WORK_DIR as string;
const blobInclusionNodeVk: Field = Field.from(JSON.parse(fs.readFileSync(`${workDir}/plonk/recursion/proofs/layer5/p0.json`, 'utf8')).publicOutput[2]);

const vk = VerificationKey.fromJSON(JSON.parse(fs.readFileSync(`${workDir}/plonk/recursion/vks/nodeVk.json`, 'utf8')))

export class Bytes29 extends Bytes(29) {}

class BlobInclusionInput extends Struct({
    namespace: Bytes29.provable,
    blob: Bytes32.provable, // this will be different for each app
    dataCommitment: Bytes32.provable,
}) {}

const blobInclusionVerifier = ZkProgram({
    name: 'blobInclusionVerifier',
    publicInput: BlobInclusionInput,
    publicOutput: Undefined,
    methods: {
      compute: {
        privateInputs: [NodeProofLeft],
        async method(
            input: BlobInclusionInput,
            proof: NodeProofLeft,
        ) {
            proof.verify(vk)
            proof.publicOutput.subtreeVkDigest.assertEquals(blobInclusionNodeVk)


            let bytes: UInt8[] = []; 
            bytes = bytes.concat([
                UInt8.from(29n),
                ...Array(15).fill(UInt8.from(0)),
            ]);    
            bytes = bytes.concat(input.namespace.bytes);    
            bytes = bytes.concat(input.blob.bytes);    
            bytes = bytes.concat(input.dataCommitment.bytes);    
             Provable.asProver(() => {
                const buffer = Buffer.from(new Uint8Array(bytes.map((byte) => byte.toNumber())));
                console.log(buffer.toString('hex'));
            });
           
            const pi0 = blobInclusionProgramVk;
            const pi1 = parsePublicInputsProvable(Bytes.from(bytes));
            
            const piDigest = Poseidon.hashPacked(Provable.Array(FrC.provable, 2), [pi0, pi1])
            piDigest.assertEquals(proof.publicOutput.rightOut)

            return undefined;
        },
      },
    },
});

const BlobInclusionProof = ZkProgram.Proof(blobInclusionVerifier);
export { blobInclusionVerifier, BlobInclusionProof, BlobInclusionInput, Bytes32 };