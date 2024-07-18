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
  } from 'o1js';
import { FrC } from '../../towers/index.js';
import { NodeProofLeft } from '../../structs.js';
import fs from "fs"
import { parsePublicInputs, parsePublicInputsProvable } from '../parse_pi.js';
import { provableBn254ScalarFieldToBytes } from '../../sha/utils.js';

export const adminPrivateKey = PrivateKey.fromBase58(
    'EKFcef5HKXAn7V2rQntLiXtJr15dkxrsrQ1G4pnYemhMEAWYbkZW'
);

export const adminPublicKey = adminPrivateKey.toPublicKey();
const rootHash: Field = Field.from("16968210608091675533548838223846734764253722179508080202270739963336034608930")
const programVk: FrC = FrC.from("0x0089c868ea2cc1b21ab43a79bae6d01dd594355ed86dd88fd747070226de9526")
const vk = VerificationKey.fromJSON(JSON.parse(fs.readFileSync('./src/plonk/recursion/vks/nodeVk.json', 'utf8')))


// class StateBytes extends Bytes(Field.sizeInBytes) {}
export class StateBytes extends Bytes(576) {}

export class HelloWorldRollup extends SmartContract {

    @state(Field) rollupState = State<Field>();

    init() {
        super.init();
        this.rollupState.set(Field(0));
        this.account.delegate.set(adminPublicKey);
    }

    @method async update(admin: PrivateKey, rootProof: NodeProofLeft, newState: StateBytes) {
        // verify the root proof
        rootProof.verify(vk)

        rootProof.publicOutput.subtreeVkDigest.assertEquals(rootHash)


        const newStatePublicInput = parsePublicInputsProvable(newState);

        let piDigest = Poseidon.hashPacked(Provable.Array(FrC.provable, 2), [programVk, newStatePublicInput])
        piDigest.assertEquals(rootProof.publicOutput.rightOut)

        this.rollupState.requireNothing();
        this.rollupState.set(Poseidon.hashPacked(StateBytes.provable, newState));

        const adminPk = admin.toPublicKey();
        this.account.delegate.requireEquals(adminPk);
    }
}