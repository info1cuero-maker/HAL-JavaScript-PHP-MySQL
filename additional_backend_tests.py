#!/usr/bin/env python3
"""
Additional HAL API Backend Tests - Edge Cases and Error Handling
"""

import requests
import json
import uuid

BASE_URL = "https://ukrbizdir.preview.emergentagent.com/api"

class HALAPIAdditionalTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        
    def test_blog_post_by_id(self):
        """Test GET /api/blog/{id} with a real blog post ID"""
        try:
            # First get blog posts to get a real ID
            response = self.session.get(f"{self.base_url}/blog")
            if response.status_code == 200:
                data = response.json()
                if data["posts"]:
                    post_id = data["posts"][0]["_id"]
                    
                    # Test getting specific blog post
                    response = self.session.get(f"{self.base_url}/blog/{post_id}")
                    if response.status_code == 200:
                        post = response.json()
                        print(f"✅ GET /api/blog/{post_id} - Retrieved blog post: {post['titleUk'][:50]}...")
                    else:
                        print(f"❌ GET /api/blog/{post_id} - Status: {response.status_code}")
                else:
                    print("❌ No blog posts available for testing")
            else:
                print(f"❌ Failed to get blog posts: {response.status_code}")
        except Exception as e:
            print(f"❌ Exception in blog post by ID test: {str(e)}")
    
    def test_blog_post_invalid_id(self):
        """Test GET /api/blog/{id} with invalid ID"""
        try:
            response = self.session.get(f"{self.base_url}/blog/invalid_id")
            if response.status_code == 400:
                print("✅ GET /api/blog/invalid_id - Correctly returned 400 for invalid ID")
            else:
                print(f"❌ GET /api/blog/invalid_id - Expected 400, got {response.status_code}")
        except Exception as e:
            print(f"❌ Exception in invalid blog ID test: {str(e)}")
    
    def test_company_reviews(self):
        """Test GET /api/companies/{id}/reviews"""
        try:
            # First get companies to get a real ID
            response = self.session.get(f"{self.base_url}/companies")
            if response.status_code == 200:
                data = response.json()
                if data["companies"]:
                    company_id = data["companies"][0]["_id"]
                    
                    # Test getting company reviews
                    response = self.session.get(f"{self.base_url}/companies/{company_id}/reviews")
                    if response.status_code == 200:
                        reviews_data = response.json()
                        print(f"✅ GET /api/companies/{company_id}/reviews - Found {len(reviews_data['reviews'])} reviews")
                    else:
                        print(f"❌ GET /api/companies/{company_id}/reviews - Status: {response.status_code}")
                else:
                    print("❌ No companies available for testing reviews")
            else:
                print(f"❌ Failed to get companies: {response.status_code}")
        except Exception as e:
            print(f"❌ Exception in company reviews test: {str(e)}")
    
    def test_auth_invalid_token(self):
        """Test authenticated endpoints with invalid token"""
        try:
            headers = {"Authorization": "Bearer invalid_token_12345"}
            response = self.session.get(f"{self.base_url}/auth/me", headers=headers)
            if response.status_code == 401:
                print("✅ GET /api/auth/me with invalid token - Correctly returned 401")
            else:
                print(f"❌ GET /api/auth/me with invalid token - Expected 401, got {response.status_code}")
        except Exception as e:
            print(f"❌ Exception in invalid token test: {str(e)}")
    
    def test_companies_edge_cases(self):
        """Test companies endpoint edge cases"""
        try:
            # Test with very high page number
            response = self.session.get(f"{self.base_url}/companies?page=999&limit=10")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ GET /api/companies?page=999 - Returned {len(data['companies'])} companies (edge case)")
            else:
                print(f"❌ GET /api/companies?page=999 - Status: {response.status_code}")
            
            # Test with invalid sort parameter
            response = self.session.get(f"{self.base_url}/companies?sort=invalid_sort")
            if response.status_code == 422:  # Validation error
                print("✅ GET /api/companies?sort=invalid_sort - Correctly returned validation error")
            else:
                print(f"❌ GET /api/companies?sort=invalid_sort - Expected 422, got {response.status_code}")
                
        except Exception as e:
            print(f"❌ Exception in companies edge cases test: {str(e)}")
    
    def test_contact_invalid_data(self):
        """Test contact endpoint with invalid data"""
        try:
            # Test with missing required fields
            invalid_data = {"name": "Test"}  # Missing email and message
            response = self.session.post(f"{self.base_url}/contact", json=invalid_data)
            if response.status_code == 422:  # Validation error
                print("✅ POST /api/contact with invalid data - Correctly returned validation error")
            else:
                print(f"❌ POST /api/contact with invalid data - Expected 422, got {response.status_code}")
        except Exception as e:
            print(f"❌ Exception in contact invalid data test: {str(e)}")
    
    def run_additional_tests(self):
        """Run all additional tests"""
        print("=" * 60)
        print("HAL API Additional Backend Tests - Edge Cases")
        print("=" * 60)
        print()
        
        self.test_blog_post_by_id()
        self.test_blog_post_invalid_id()
        self.test_company_reviews()
        self.test_auth_invalid_token()
        self.test_companies_edge_cases()
        self.test_contact_invalid_data()
        
        print()
        print("=" * 60)
        print("Additional tests completed")
        print("=" * 60)

if __name__ == "__main__":
    tester = HALAPIAdditionalTester()
    tester.run_additional_tests()