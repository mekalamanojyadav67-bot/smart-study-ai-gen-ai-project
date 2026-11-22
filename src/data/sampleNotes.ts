export interface SampleNote {
  id: string;
  title: string;
  subject: string;
  content: string;
}

export const SAMPLE_NOTES: SampleNote[] = [
  {
    id: 'sample-biology',
    title: 'Cellular Respiration & ATP Synthesis',
    subject: 'Biology',
    content: `Cellular respiration is the metabolic pathway through which cells convert chemical energy stored in glucose (C6H12O6) into adenosine triphosphate (ATP), the primary energy currency of the cell. The overall chemical equation is: C6H12O6 + 6 O2 -> 6 CO2 + 6 H2O + ~30-32 ATP.

1. Glycolysis (Cytoplasm)
Glycolysis occurs in the cytosol and does not require oxygen (anaerobic). One 6-carbon glucose molecule is split into two 3-carbon pyruvate molecules. It consists of an energy investment phase (consuming 2 ATP) and an energy payoff phase (producing 4 ATP and 2 NADH). Net yield: 2 ATP, 2 NADH, and 2 pyruvate.

2. Pyruvate Oxidation & The Krebs (Citric Acid) Cycle (Mitochondrial Matrix)
In the presence of oxygen, pyruvate enters the mitochondrial matrix and is converted into Acetyl-CoA by pyruvate dehydrogenase, releasing CO2 and producing 1 NADH per pyruvate. Acetyl-CoA (2 carbons) then joins oxaloacetate (4 carbons) to form citrate (6 carbons). Through eight enzyme-catalyzed reactions, citrate is oxidized back to oxaloacetate. Per glucose molecule (2 turns of the cycle), the Krebs cycle yields: 4 CO2, 6 NADH, 2 FADH2, and 2 GTP (equivalent to 2 ATP).

3. Oxidative Phosphorylation: Electron Transport Chain & Chemiosmosis (Inner Mitochondrial Membrane)
NADH and FADH2 donate high-energy electrons to protein complexes (Complexes I-IV) embedded in the inner mitochondrial membrane. As electrons pass down the chain to oxygen—the terminal electron acceptor, which combines with protons to form water—Complexes I, III, and IV pump protons (H+) from the mitochondrial matrix into the intermembrane space. This creates an electrochemical proton gradient called the proton-motive force. Protons flow back into the matrix through ATP synthase, driving the phosphorylation of ADP + Pi into ATP (chemiosmosis), generating approximately 26-28 ATP.

4. Fermentation (Anaerobic Alternative)
When oxygen is absent, the electron transport chain halts. To regenerate NAD+ so glycolysis can continue producing 2 ATP per glucose, cells perform fermentation. Animal muscle cells undergo lactic acid fermentation (pyruvate -> lactate), while yeast performs alcoholic fermentation (pyruvate -> ethanol + CO2).`,
  },
  {
    id: 'sample-cs',
    title: 'Binary Search Trees & Big-O Complexity',
    subject: 'Computer Science',
    content: `A Binary Search Tree (BST) is a node-based hierarchical data structure where each node holds a key and references to at most two children: a left child and a right child.

Core BST Invariant:
For every node N in the tree:
- All keys in N's left subtree are strictly less than N.key.
- All keys in N's right subtree are strictly greater than N.key.
- Both left and right subtrees must themselves be valid Binary Search Trees.

Core Operations & Time Complexity:
1. Search: Start at the root. If target == current.key, return node. If target < current.key, recurse left; otherwise recurse right. On a balanced BST of n nodes, height h = O(log n), so search takes O(log n) time.
2. Insertion: Traverse from the root following the BST invariant until an empty child pointer is found, then attach the new node there. Average time: O(log n).
3. Deletion: Three cases exist when removing node X:
   - Case 1 (Leaf node): Simply unlink X from its parent.
   - Case 2 (One child): Replace X with its single child.
   - Case 3 (Two children): Find X's in-order successor (the smallest node in X's right subtree) or in-order predecessor (largest node in X's left subtree), copy its key to X, and recursively delete the successor/predecessor.

Tree Traversals:
- In-Order (Left, Root, Right): Visits keys in strictly ascending sorted order.
- Pre-Order (Root, Left, Right): Useful for serializing or cloning the tree structure.
- Post-Order (Left, Right, Root): Useful for safely deleting or freeing nodes bottom-up.

Worst-Case Degeneration & Self-Balancing Trees:
If keys are inserted in already sorted order (e.g., 1, 2, 3, 4, 5), a standard BST degenerates into a skewed linked list of height n, degrading search, insert, and delete to O(n). Self-balancing BSTs like AVL Trees (strict height balance factor of -1, 0, or +1 using single/double rotations) and Red-Black Trees (color invariants ensuring longest path is at most twice the shortest path) guarantee O(log n) worst-case performance.`,
  },
  {
    id: 'sample-history',
    title: 'Macroeconomics: Monetary vs. Fiscal Policy',
    subject: 'Economics',
    content: `Governments and central banks use two primary macroeconomic toolkits to stabilize economic growth, manage inflation, and reduce unemployment: Monetary Policy and Fiscal Policy.

1. Monetary Policy (Controlled by the Central Bank, e.g., Federal Reserve)
Monetary policy regulates the money supply and interest rates.
- Expansionary Monetary Policy (used during recessions): The central bank lowers the policy interest rate (such as the Federal Funds Rate) and buys government bonds via Open Market Operations (OMO). Lower interest rates reduce borrowing costs for businesses and households, stimulating investment and consumption, shifting Aggregate Demand (AD) right.
- Contractionary Monetary Policy (used to fight high inflation): The central bank raises interest rates, sells bonds in OMO, or increases bank reserve requirements. Higher borrowing costs cool spending and slow price increases.
- Liquidity Trap Caveat: When nominal interest rates approach zero (Zero Lower Bound), traditional rate cuts lose effectiveness because people hoard cash rather than spend or invest.

2. Fiscal Policy (Controlled by Congress / Government Treasury)
Fiscal policy uses government spending (G) and taxation (T) to influence economic output.
- Expansionary Fiscal Policy: Increasing government infrastructure/program spending or cutting personal/corporate taxes increases disposable income and directly boosts Aggregate Demand.
- Contractionary Fiscal Policy: Cutting public spending or raising taxes reduces budget deficits and cools an overheating economy.
- The Spending Multiplier: An initial dollar of government spending circulates through the economy as income and consumption. With Marginal Propensity to Consume (MPC), the spending multiplier equals 1 / (1 - MPC).
- Crowding-Out Effect: Large government borrowing to finance deficit spending can drive up market interest rates, potentially reducing private-sector business investment.

3. Policy Lags & Coordination
Monetary policy has short implementation lags (central bank boards meet regularly) but longer impact lags (6–18 months). Fiscal policy faces long legislative recognition and implementation lags, though its spending impact can be direct once enacted.`,
  },
];
