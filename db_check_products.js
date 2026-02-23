
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://evmheqkbbmrpznzjbplk.supabase.co';
const supabaseKey = 'sb_publishable_uSWthB6vHwexAubA4pMSwg_6dwGea32';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProductData() {
    console.log('--- Checking PRODUCT Data ---');
    const { data, error } = await supabase.from('products').select('id, name, base_price, price_per_unit');

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log(JSON.stringify(data, null, 2));
    }
}

checkProductData();
