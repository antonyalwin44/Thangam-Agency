
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://evmheqkbbmrpznzjbplk.supabase.co';
const supabaseKey = 'sb_publishable_uSWthB6vHwexAubA4pMSwg_6dwGea32';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrderPaymentColumns() {
    console.log('--- Checking ORDERS Table for Payment Columns ---');
    const candidates = [
        'payment', 'payment_method', 'payment_status', 'method', 'pay_method',
        'payment_type', 'transaction_id', 'upi_id', 'card_last4', 'paid_at'
    ];

    for (const column of candidates) {
        const { error } = await supabase.from('orders').select(column).limit(1);
        if (!error) {
            console.log(`✅ Column [${column}] EXISTS!`);
        }
    }
}

checkOrderPaymentColumns();
