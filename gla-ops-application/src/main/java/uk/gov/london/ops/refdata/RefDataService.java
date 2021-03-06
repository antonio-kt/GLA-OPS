/**
 * Copyright (c) Greater London Authority, 2016.
 *
 * This source code is licensed under the Open Government Licence 3.0.
 *
 * http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/
 */
package uk.gov.london.ops.refdata;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import uk.gov.london.ops.framework.exception.ValidationException;
import uk.gov.london.ops.payment.PaymentSource;
import uk.gov.london.ops.payment.implementation.repository.PaymentSourceRepository;
import uk.gov.london.ops.refdata.implementation.repository.*;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Reference data service.
 *
 * Provides access to various forms of reference data.
 */
@Service
public class RefDataService {

    @Autowired
    BoroughRepository boroughRepository;

    @Autowired
    CategoryValueRepository categoryValueRepository;

    @Autowired
    ConfigurableListItemRepository configurableListItemRepository;

    @Autowired
    FinanceCategoryRepository financeCategoryRepository;

    @Autowired
    MarketTypeRepository marketTypeRepository;

    @Autowired
    TenureTypeRepository tenureTypeRepository;

    @Autowired
    PaymentSourceRepository paymentSourceRepository;

    @Autowired
    WardRepository wardRepository;

    private Map<String, PaymentSource> paymentSourceMap = null;

    public Map<String, PaymentSource> getPaymentSourceMap() {
        if (paymentSourceMap == null) {
            paymentSourceMap = paymentSourceRepository.findAll().stream().collect(Collectors.toMap(PaymentSource::getName,
                    Function.identity()));
        }
        return paymentSourceMap;
    }


    public List<Borough> getBoroughs() {
        return boroughRepository.findAll();
    }

    public Borough findBoroughByName(String borough) {
        return boroughRepository.findByBoroughName(borough);
    }

    public List<CategoryValue> getCategoryValues(CategoryValue.Category category) {
        return categoryValueRepository.findAllByCategoryOrderByDisplayOrder(category);
    }

    public List<CategoryValue> findAllByCategoryOrderByDisplayOrder(CategoryValue.Category category) {
        return categoryValueRepository.findAllByCategoryOrderByDisplayOrder(category);
    }

    public CategoryValue getCategoryValue(Integer id) {
        return categoryValueRepository.findById(id).orElse(null);
    }

    public CategoryValue findByCategoryAndDisplayValue(CategoryValue.Category category, String displayValue) {
        return categoryValueRepository.findByCategoryAndDisplayValue(category, displayValue);
    }

    public List<ConfigurableListItem> getConfigurableListItemsByExtID(Integer externalId) {
        return configurableListItemRepository.findAllByExternalIdOrderByDisplayOrder(externalId);
    }

    public List<ConfigurableListItem> createConfigurableListItems(List<ConfigurableListItem> items) {
        return configurableListItemRepository.saveAll(items);
    }

    public FinanceCategory getFinanceCategory(Integer id) {
        return financeCategoryRepository.findById(id).orElse(null);
    }

    public FinanceCategory getFinanceCategoryByText(String text) {
        return financeCategoryRepository.findFirstByText(text);
    }

    public FinanceCategory getFinanceCategoryByCeCode(Integer ceCode) {
        return financeCategoryRepository.findByCeCode(ceCode);
    }

    public List<MarketType> getMarketTypes() {
        return marketTypeRepository.findAll();
    }

    public MarketType getMarketType(Integer id) {
        return marketTypeRepository.findById(id).orElse(null);
    }

    public MarketType getMarketTypeByName(String name) {
        return marketTypeRepository.findByName(name);
    }

    public List<TenureType> getTenureTypes() {
        return tenureTypeRepository.findAll();
    }

    public TenureType getTenureType(Integer id) {
        return tenureTypeRepository.findById(id).orElse(null);
    }

    public TenureType createTenureType(TenureType tenureType) {
        return tenureTypeRepository.save(tenureType);
    }

    public List<Ward> getWards() {
        return wardRepository.findAll();
    }

    public Set<PaymentSource> getAvailablePaymentSources() {
        return new HashSet<>(paymentSourceRepository.findAll());
    }

    @Scheduled(cron = "${paymentsource.cache.expiry.scheduler.cron.expression}")
    public void expireCache() {
        this.paymentSourceMap = null;
    }

    public PaymentSource createPaymentSource(PaymentSource paymentSource) {
        if (StringUtils.isEmpty(paymentSource.getName())
                || StringUtils.isEmpty(paymentSource.getDescription())
                || paymentSource.getGrantType() == null) {
            throw new ValidationException("Ensure all fields are present (name, description and grantType");
        }
        if (paymentSourceMap.get(paymentSource.getName()) != null) {
            throw new ValidationException(String.format("Payment source with name %s already exists", paymentSource.getName()));
        }

        this.paymentSourceMap = null;
        return paymentSourceRepository.save(paymentSource);
    }
}
