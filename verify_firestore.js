const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

console.log('Project ID from env:', process.env.FIREBASE_PROJECT_ID);

const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCyLwDBpcUm4sD+
6mpQeTkqqJ9MK2Y+ioA9WUwMCfhIe7z0MKKyVHVqJszqi4Hd1O6MsJ4YGE93WTyJ
jlRxUBLwbms3uIFPC45hgARwUU+XDQzwoDh49DbvCwGwvn9mb2wkm36/3HMMBaBm
dw1mS+VJRmStWl1/MmLXzlSriWC6OfJpyhsbu+JmQhEhQXujQFsxzHMnZsjLhu9f
T4lbj7eEU9IEcbUQRsXOMOseDVlNprg4Z0lqzv3m55TWmy1DV1TpxE248bLymH5U
0ZdDVLdIUlK+HU3STiWGpZnJ7m7Kmqzm4TnHTUxi4QSlxMJFLa3L0QDd/u00Kpah
7QmzgGMxAgMBAAECggEAB7m8/ShsU2LKfmL4iBOxdFWKTpmlHboQlFheUTlPcAkZ
aLcBHt1Fl/wlr1esIkucqjHwMNhA/co7MzWeGKmhoJYRBQH1bVFxc23DA4GrA0AY
Gwi/WhMwnI2sHZcs2+qh1DZ/uN7ciB1oVnj79j79Kn+oVtHPsveizHuQNT3IGVre
Pr88FJ+vAQjLoutekonFJcQpTaWQ8k8KklmDZv/8saKdFp4mrzirZImVZtFVftxe
/khRZ7Z/0fc+TRPoXss5RCOQXOF7HFZuKOXF6NcO66FLw3CcvLjJk7lAYNdFKvxT
gCVGC6ydwN/XpttucpmRgb52Qnz5z4pu70xE3iiwTwKBgQDopDixTjd3mjnLCM2l
sv4q5K3hR9yDGcVdwnpt7MoF2gQ5bOqOFSxTKF/6iXG5H7a5KynHZ967ggUx+E9w
0wYmi3F+bvx/8MOMWdb0qOWkbmpnG/oZAzdBmtA3QYIURzcsiXgsdYWCH3aDCefL
CI2OSuJVu6WHYLxnzBjNIGXLawKBgQDEEwFHlIJsca/U9s1YFiguFzc/xT6ha6on
w0tsBRpRtHa4sHZSmPW5fMfkEQFnIgMb9TPOUVQI32fKT7/e+KowF7SmneTNlBgz
OTHKJN11nxnAaZH1wjQwUb6VBZgu4pKfFte24TG/DC4kNY4EQKIYcr7UIY/sG8DY
gU2fUsWu0wKBgBYGvmtjKXNEgeZMThQ7Lz9maWQkBqfO/9XRvP+9ZJ9LNg0t18Ne
E9VHxFaXPtI1Q3qisJD1r6v3MoC5ruPSxwlNOJCs93ExnYIjW2vMtflsjtx2VKab
nnFa0zrP8mtFKsNmhpmQnOF3KltDvVifuBmELjARsAM8hhJUbSNnbEGhDAoGBAJ+3
v34YelluDkYTONg9TEOnQ6kdulPxiOzVB/YY/gR6VY9Cp0/HK7sJ6yZbt+HT8eZv
SeERnLuRiFFjvy8ZLkD4vn5O9heEQGZRe75nY0Kx9F8pX+1qYerOW8m2ge4HQFp5
WASv0j8G4/s46NOL9r6lkc7o+/zf6qoyQhG7ci5jAoGBALSvB/qRPQ2FRkoe1Hqk
m0dL4v7CVCiP7w355ci81MW2DfI/iXpMfxJgtmBMma/+3QyGk5pAioIgzEK4OME1
nzwe5dIJFjZ8hZ8LsMP2x/2RVRu7QWBLvxF1y3FihR/EYgmVNNGp/z3wYEj0TYTH8
z8TfOtU
-----END PRIVATE KEY-----`;

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  }),
});

const db = getFirestore(app);

async function check() {
  const collections = await db.listCollections();
  console.log('Total collections found:', collections.length);
  for (const col of collections) {
    console.log('Collection ID:', col.id);
  }
}

check();
