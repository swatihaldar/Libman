import frappe
from frappe.model.document import Document
from datetime import datetime
from library_management_web_application.public.utils import hns_utils
import json


class Transactions(Document):
    
    # my_instance=hns_utils()
    # def on_update(self):
        
    #     m_ver =self.my_instance.check_version()
    #     frappe.msgprint(json.dumps(m_ver,indent=1))
    
    
    def validate(self):
        
        # m_ver = check_version()
        # if  m_ver:
        #     frappe.msgprint(str(m_ver))
        
            
            
            
        
        book = frappe.get_doc("Books", self.book)
        
        if self.status == "Issued":
            member = frappe.get_doc("Members", self.member)
            issued_record = frappe.db.exists(
                "Transactions",
                {"member": self.member, "book": self.book, "status": "Issued"}
            )
            if issued_record:
                frappe.throw("You cannot issue the same book again until it is returned.")

            if member.outstanding_debt > 500:
                frappe.throw(
                    "Outstanding debt exceeds ₹500. You cannot issue a new book until the debt is cleared."
                )
            else:
                if book.stock_quantity > 0:
                    book.stock_quantity -= 1
                    book.save()
                else:
                    frappe.throw("No available stock for this book.")
        
        elif self.status == "Returned":
            book.stock_quantity += 1
            book.save()

    def before_save(self):
        issued_record = frappe.db.get_value(
                'Transactions',
                {"member": self.member, "book": self.book, "status": "Issued"},
                ["name","issue_date", "due_date", "rent_fee"],
                as_dict=True
            )
        if issued_record and self.name != issued_record['name'] and self.status != "Issued":
            frappe.throw(
                f"You cannot create a new transaction for returning this book. "
                f"Please return it from the original transaction (ID: {issued_record['name']})."
            )
        if self.status == "Issued" and self.issue_date and self.due_date:
            issue_date = datetime.strptime(self.issue_date, '%Y-%m-%d')
            due_date = datetime.strptime(self.due_date, '%Y-%m-%d')
            rental_days = (due_date - issue_date).days  
            self.rent_fee = rental_days * 10

            member = frappe.get_doc("Members", self.member)
            member.outstanding_debt += self.rent_fee
            member.save()

            frappe.msgprint(
                f"Book Issued Successfully. You have borrowed the book for {rental_days} days and your fee is calculated at ₹10 per day, totaling ₹{self.rent_fee}. Thank you!"
            )

        elif self.status == "Returned":
            
            if not issued_record:
                frappe.throw("You cannot return this book because it has not been issued yet.")
            
            self.issue_date = issued_record["issue_date"]
            self.due_date = issued_record["due_date"]
            self.rent_fee = issued_record["rent_fee"]
            self.return_date = datetime.today().date()

            delay_days = (self.return_date - self.due_date).days
            if delay_days > 0:
                self.late_fine = delay_days * 20

                member = frappe.get_doc("Members", self.member)
                member.outstanding_debt += self.late_fine
                member.save()

                frappe.msgprint(
                    f"You returned the book {delay_days} days late. A late fee of ₹{self.late_fine} has been added to your outstanding debt."
                )

        
