#!/bin/bash
# Test script for rafts.testapp.ca subdomain deployment

echo "Testing RAFTS subdomain deployment"
echo "=================================="

echo -e "\n1. DNS Resolution:"
nslookup rafts.testapp.ca || echo "DNS lookup failed"

echo -e "\n2. HTTP redirect (should redirect to HTTPS):"
curl -I -s http://rafts.testapp.ca | grep -E "(HTTP|Location)"

echo -e "\n3. HTTPS access:"
curl -I -s https://rafts.testapp.ca | grep -E "(HTTP|Server)"

echo -e "\n4. SSL Certificate check:"
echo | openssl s_client -connect rafts.testapp.ca:443 -servername rafts.testapp.ca 2>/dev/null | openssl x509 -noout -subject -issuer -dates 2>/dev/null || echo "Certificate check failed"

echo -e "\n5. API endpoint test:"
curl -I -s https://rafts.testapp.ca/api/health | grep HTTP

echo -e "\n6. Checking nginx container logs:"
echo "Recent nginx errors (if any):"
docker logs cadc-ui-nginx 2>&1 | grep -i "rafts" | tail -10

echo -e "\nDone!"