function isInteger(num) {
    return Number.isInteger(num);
}

function findPrimes(a, b) {
    for (let i = a; i <= b; i++) {
        if (i < 2) continue;

        let isPrime = true;
        for (let j = 2; j <= Math.sqrt(i); j++) {
            if (i % j === 0) {
                isPrime = false;
                break;
            }
        }

        if (isPrime) {
            console.log(i);
        }
    }
}

