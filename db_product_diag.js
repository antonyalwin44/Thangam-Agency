
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://evmheqkbbmrpznzjbplk.supabase.co';
const supabaseKey = 'sb_publishable_uSWthB6vHwexAubA4pMSwg_6dwGea32';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProductColumns() {
    console.log('--- Checking PRODUCTS Table Columns ---');
    const candidates = ['id', 'name', 'price', 'base_price', 'price_per_unit', 'unit_type', 'unit', 'current_stock', 'stock'];

    for (const column of candidates) {
        const { error } = await supabase.from('products').select(column).limit(1);
        if (!error) {
            console.log(`✅ Column [${column}] EXISTS!`);
        }
    }
}

checkProductColumns();
